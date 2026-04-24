import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { CustomerProfile } from '../users/entities/customer-profile.entity';
import { UserRole } from '../users/entities/user-role.enum';
import { User } from '../users/entities/user.entity';
import { JwtActor } from './jwt-actor.type';
import { AssociateCustomer } from '../users/entities/associate-customer.entity';
import { AssociateProfile } from '../users/entities/associate-profile.entity';
import { CreateCustomerDto } from '../users/dto/create-customer.dto';
import { ApplicationType } from '../applications/entities/application-type.entity';
import { CustomerApplication } from './entities/customer-application.entity';
import { CustomerApplicationStatus } from './entities/customer-application-status.enum';
import { ApplicationTypesService } from '../applications/application-types.service';
import { ApplicationWorkflowService } from '../applications/application-workflow.service';
import { CustomerApplicationPipelineProgress } from '../applications/entities/customer-application-pipeline-progress.entity';
import { CustomerApplicationDocument } from '../applications/entities/customer-application-document.entity';
import { CustomerApplicationWorkflowService } from './customer-application-workflow.service';
import { CreateCustomerApiDto } from './dto/create-customer-api.dto';
import { ListCustomersQueryDto } from './dto/list-customers-query.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { CreateCustomerApplicationDto } from './dto/create-customer-application.dto';
import { UpdateCustomerApplicationDto } from './dto/update-customer-application.dto';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(CustomerProfile)
    private readonly customerRepository: Repository<CustomerProfile>,
    @InjectRepository(CustomerApplication)
    private readonly applicationRepository: Repository<CustomerApplication>,
    @InjectRepository(AssociateCustomer)
    private readonly associateCustomerRepository: Repository<AssociateCustomer>,
    @InjectRepository(AssociateProfile)
    private readonly associateProfileRepository: Repository<AssociateProfile>,
    private readonly applicationTypesService: ApplicationTypesService,
    private readonly applicationWorkflowService: ApplicationWorkflowService,
    private readonly customerApplicationWorkflowService: CustomerApplicationWorkflowService,
    private readonly dataSource: DataSource,
  ) {}

  async create(
    dto: CreateCustomerApiDto,
    createdBy: JwtActor,
  ): Promise<ReturnType<CustomersService['toCustomerDetail']>> {
    this.assertAdminOrAssociate(createdBy);
    if (!dto.applicationTypeId && !dto.applicationTypeCode) {
      throw new BadRequestException('Provide applicationTypeId or applicationTypeCode');
    }
    const appType = await this.resolveApplicationType({
      applicationTypeId: dto.applicationTypeId,
      applicationTypeCode: dto.applicationTypeCode,
    });

    const normalizedEmail = dto.email.trim().toLowerCase();
    await this.assertEmailAvailable(normalizedEmail);

    const phone = dto.phone.trim();
    const { firstName, lastName } = this.splitName(dto.name);
    const associateId = await this.resolveAssociateAssignmentOnCreate(dto, createdBy);

    const customer = await this.dataSource.transaction(async (em) => {
      const c = em.create(CustomerProfile, {
        email: normalizedEmail,
        role: UserRole.CUSTOMER,
        firstName,
        lastName,
        phoneNumber: phone,
        property: dto.property.trim(),
        address: dto.address,
        profilePhoto: dto.profilePhoto,
      });
      const saved = await em.save(CustomerProfile, c);

      const app = em.create(CustomerApplication, {
        customerId: saved.id,
        applicationTypeId: appType.id,
        status: dto.status ?? CustomerApplicationStatus.DRAFT,
        pipeline: dto.pipeline ?? null,
      });
      const savedApp = await em.save(CustomerApplication, app);
      await this.applicationWorkflowService.instantiateForNewApplication(
        em,
        savedApp.id,
        appType.id,
      );
      if (associateId) {
        const existingLink = await em.findOne(AssociateCustomer, {
          where: { associateId, customerId: saved.id },
        });
        if (!existingLink) {
          await em.save(
            AssociateCustomer,
            em.create(AssociateCustomer, {
              associateId,
              customerId: saved.id,
            }),
          );
        }
      }
      return saved;
    });

    return this.findOneDetail(customer.id, createdBy);
  }

  /** Used by `POST /users/customers` — resolves type from id, code, or legacy label string. */
  async createFromLegacyDto(
    dto: CreateCustomerDto,
    createdBy?: JwtActor,
  ): Promise<CustomerProfile> {
    this.assertAdminOrAssociate(createdBy);
    const effectiveRole = dto.role ?? UserRole.CUSTOMER;
    if (effectiveRole !== UserRole.CUSTOMER) {
      throw new ForbiddenException('Role must be customer');
    }

    const appType = await this.resolveApplicationTypeForLegacy(dto);

    const normalizedEmail = dto.email.trim().toLowerCase();
    await this.assertEmailAvailable(normalizedEmail);

    const phone = dto.phone?.trim() ?? '';
    if (!phone) {
      throw new BadRequestException('Phone is required');
    }

    const { firstName, lastName } = this.splitName(dto.name);

    return this.dataSource.transaction(async (em) => {
      const c = em.create(CustomerProfile, {
        email: normalizedEmail,
        role: UserRole.CUSTOMER,
        firstName,
        lastName,
        phoneNumber: phone,
        property: dto.property.trim(),
        address: dto.address,
        profilePhoto: dto.profilePhoto,
      });
      const saved = await em.save(CustomerProfile, c);

      const legacyApp = await em.save(
        CustomerApplication,
        em.create(CustomerApplication, {
          customerId: saved.id,
          applicationTypeId: appType.id,
          status: CustomerApplicationStatus.DRAFT,
          pipeline: null,
        }),
      );
      await this.applicationWorkflowService.instantiateForNewApplication(
        em,
        legacyApp.id,
        appType.id,
      );

      return saved;
    });
  }

  async findAll(actor: JwtActor, query: ListCustomersQueryDto): Promise<ReturnType<CustomersService['toCustomerDetail']>[]> {
    this.assertAdminOrAssociate(actor);

    if (actor.role === UserRole.ADMIN) {
      const customers = await this.queryCustomersWithFiltersForList(query, undefined);
      const details = await Promise.all(customers.map((c) => this.toCustomerDetail(c)));
      return this.attachAssignedAssociates(details);
    }

    const ids = await this.customerIdsForAssociateUser(actor.id);
    if (!ids.length) {
      return [];
    }
    const customers = await this.queryCustomersWithFiltersForList(query, ids);
    const details = await Promise.all(customers.map((c) => this.toCustomerDetail(c)));
    return this.attachAssignedAssociates(details);
  }

  async findOneDetail(customerId: string, actor: JwtActor): Promise<ReturnType<CustomersService['toCustomerDetail']>> {
    this.assertAdminOrAssociate(actor);
    const customer = await this.customerRepository.findOne({
      where: { id: customerId },
      relations: [
        'applications',
        'applications.applicationType',
        'applications.pipelineProgress',
        'applications.applicationDocuments',
        'applications.applicationDocuments.requirement',
      ],
    });
    if (!customer) {
      throw new NotFoundException(`Customer #${customerId} not found`);
    }
    await this.assertCanAccessCustomer(actor, customerId);
    const detail = await this.toCustomerDetail(customer);
    const [withAssociates] = await this.attachAssignedAssociates([detail]);
    return withAssociates;
  }

  async updateCustomer(
    customerId: string,
    dto: UpdateCustomerDto,
    actor: JwtActor,
  ): Promise<ReturnType<CustomersService['toCustomerDetail']>> {
    this.assertAdminOrAssociate(actor);
    await this.assertCanAccessCustomer(actor, customerId);

    const customer = await this.customerRepository.findOne({ where: { id: customerId } });
    if (!customer) {
      throw new NotFoundException(`Customer #${customerId} not found`);
    }

    if (dto.email !== undefined) {
      const normalizedEmail = dto.email.trim().toLowerCase();
      const existing = await this.customerRepository.findOne({ where: { email: normalizedEmail } });
      if (existing && existing.id !== customerId) {
        throw new ConflictException('Email already in use');
      }
      customer.email = normalizedEmail;
    }

    if (dto.name !== undefined) {
      const { firstName, lastName } = this.splitName(dto.name);
      customer.firstName = firstName;
      customer.lastName = lastName;
    }

    if (dto.phone !== undefined) {
      customer.phoneNumber = dto.phone.trim();
    }
    if (dto.property !== undefined) {
      customer.property = dto.property;
    }
    if (dto.address !== undefined) {
      customer.address = dto.address;
    }
    if (dto.profilePhoto !== undefined) {
      customer.profilePhoto = dto.profilePhoto;
    }

    await this.customerRepository.save(customer);
    return this.findOneDetail(customerId, actor);
  }

  async removeCustomer(customerId: string, actor: JwtActor): Promise<void> {
    if (!actor || actor.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only Admin can delete customers');
    }
    const customer = await this.customerRepository.findOne({ where: { id: customerId } });
    if (!customer) {
      throw new NotFoundException(`Customer #${customerId} not found`);
    }
    await this.customerRepository.delete(customerId);
  }

  async addApplication(
    customerId: string,
    dto: CreateCustomerApplicationDto,
    actor: JwtActor,
  ): Promise<ReturnType<CustomersService['toCustomerDetail']>> {
    this.assertAdminOrAssociate(actor);
    await this.assertCanAccessCustomer(actor, customerId);

    if (!dto.applicationTypeId && !dto.applicationTypeCode) {
      throw new BadRequestException('Provide applicationTypeId or applicationTypeCode');
    }

    const appType = await this.resolveApplicationType({
      applicationTypeId: dto.applicationTypeId,
      applicationTypeCode: dto.applicationTypeCode,
    });

    const customer = await this.customerRepository.findOne({ where: { id: customerId } });
    if (!customer) {
      throw new NotFoundException(`Customer #${customerId} not found`);
    }

    const savedApp = await this.applicationRepository.save(
      this.applicationRepository.create({
        customerId,
        applicationTypeId: appType.id,
        status: dto.status ?? CustomerApplicationStatus.DRAFT,
        pipeline: dto.pipeline ?? null,
      }),
    );
    await this.dataSource.transaction(async (em) => {
      await this.applicationWorkflowService.instantiateForNewApplication(
        em,
        savedApp.id,
        appType.id,
      );
    });

    return this.findOneDetail(customerId, actor);
  }

  async updateApplication(
    customerId: string,
    applicationId: string,
    dto: UpdateCustomerApplicationDto,
    actor: JwtActor,
  ): Promise<ReturnType<CustomersService['toCustomerDetail']>> {
    this.assertAdminOrAssociate(actor);
    await this.assertCanAccessCustomer(actor, customerId);

    const app = await this.applicationRepository.findOne({
      where: { id: applicationId, customerId },
      relations: ['applicationType'],
    });
    if (!app) {
      throw new NotFoundException(`Application #${applicationId} not found for this customer`);
    }

    const previousTypeId = app.applicationTypeId;

    const hasTypeId = dto.applicationTypeId !== undefined && dto.applicationTypeId.trim() !== '';
    const hasTypeCode = dto.applicationTypeCode !== undefined && dto.applicationTypeCode.trim() !== '';
    if (hasTypeId || hasTypeCode) {
      const nextType = await this.resolveApplicationType({
        applicationTypeId: hasTypeId ? dto.applicationTypeId : undefined,
        applicationTypeCode: hasTypeCode ? dto.applicationTypeCode : undefined,
      });
      app.applicationTypeId = nextType.id;
    }

    if (dto.status !== undefined) {
      app.status = dto.status;
    }
    if (dto.pipeline !== undefined) {
      app.pipeline = dto.pipeline;
    }

    await this.applicationRepository.save(app);

    if (app.applicationTypeId !== previousTypeId) {
      await this.dataSource.manager.delete(CustomerApplicationPipelineProgress, {
        customerApplicationId: app.id,
      });
      await this.dataSource.manager.delete(CustomerApplicationDocument, {
        customerApplicationId: app.id,
      });
      await this.dataSource.transaction(async (em) => {
        await this.applicationWorkflowService.instantiateForNewApplication(
          em,
          app.id,
          app.applicationTypeId,
        );
      });
    }

    return this.findOneDetail(customerId, actor);
  }

  async removeApplication(customerId: string, applicationId: string, actor: JwtActor): Promise<void> {
    if (!actor || actor.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only Admin can delete customer applications');
    }
    const app = await this.applicationRepository.findOne({
      where: { id: applicationId, customerId },
    });
    if (!app) {
      throw new NotFoundException(`Application #${applicationId} not found for this customer`);
    }
    await this.applicationRepository.remove(app);
  }

  private async queryCustomersWithFilters(
    query: ListCustomersQueryDto,
    restrictToCustomerIds: string[] | undefined,
  ): Promise<CustomerProfile[]> {
    let candidateIds: string[] | undefined = restrictToCustomerIds;

    if (query.applicationTypeId) {
      const rows = await this.applicationRepository.find({
        where: { applicationTypeId: query.applicationTypeId },
        select: ['customerId'],
      });
      const matched = [...new Set(rows.map((r) => r.customerId))];
      candidateIds = this.intersectIdSets(candidateIds, matched);
    }

    if (query.applicationTypeCode?.trim()) {
      const type = await this.applicationTypesService.findActiveByCode(query.applicationTypeCode.trim());
      if (!type) {
        return [];
      }
      const rows = await this.applicationRepository.find({
        where: { applicationTypeId: type.id },
        select: ['customerId'],
      });
      const matched = [...new Set(rows.map((r) => r.customerId))];
      candidateIds = this.intersectIdSets(candidateIds, matched);
    }

    if (candidateIds !== undefined && candidateIds.length === 0) {
      return [];
    }

    const qb = this.customerRepository
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.applications', 'app')
      .leftJoinAndSelect('app.applicationType', 't')
      .leftJoinAndSelect('app.pipelineProgress', 'prog')
      .leftJoinAndSelect('app.applicationDocuments', 'docs')
      .leftJoinAndSelect('docs.requirement', 'docreq')
      .orderBy('c.createdAt', 'DESC');

    if (candidateIds?.length) {
      qb.andWhere('c.id IN (:...ids)', { ids: candidateIds });
    }

    if (query.email?.trim()) {
      qb.andWhere('LOWER(c.email) LIKE LOWER(:email)', { email: `%${query.email.trim()}%` });
    }

    return qb.getMany();
  }

  private async queryCustomersWithFiltersForList(
    query: ListCustomersQueryDto,
    restrictToCustomerIds: string[] | undefined,
  ): Promise<CustomerProfile[]> {
    let candidateIds: string[] | undefined = restrictToCustomerIds;

    if (query.applicationTypeId) {
      const rows = await this.applicationRepository.find({
        where: { applicationTypeId: query.applicationTypeId },
        select: ['customerId'],
      });
      const matched = [...new Set(rows.map((r) => r.customerId))];
      candidateIds = this.intersectIdSets(candidateIds, matched);
    }

    if (query.applicationTypeCode?.trim()) {
      const type = await this.applicationTypesService.findActiveByCode(query.applicationTypeCode.trim());
      if (!type) {
        return [];
      }
      const rows = await this.applicationRepository.find({
        where: { applicationTypeId: type.id },
        select: ['customerId'],
      });
      const matched = [...new Set(rows.map((r) => r.customerId))];
      candidateIds = this.intersectIdSets(candidateIds, matched);
    }

    if (candidateIds !== undefined && candidateIds.length === 0) {
      return [];
    }

    const qb = this.customerRepository
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.applications', 'app')
      .leftJoinAndSelect('app.applicationType', 't')
      .orderBy('c.createdAt', 'DESC');

    if (candidateIds?.length) {
      qb.andWhere('c.id IN (:...ids)', { ids: candidateIds });
    }

    if (query.email?.trim()) {
      qb.andWhere('LOWER(c.email) LIKE LOWER(:email)', { email: `%${query.email.trim()}%` });
    }

    return qb.getMany();
  }

  private intersectIdSets(
    base: string[] | undefined,
    matched: string[],
  ): string[] | undefined {
    if (!matched.length) {
      return [];
    }
    if (base === undefined) {
      return matched;
    }
    const set = new Set(matched);
    return base.filter((id) => set.has(id));
  }

  private async customerIdsForAssociateUser(associateUserId: string): Promise<string[]> {
    const associateProfile = await this.associateProfileRepository.findOne({
      where: { userId: associateUserId },
    });
    if (!associateProfile) {
      return [];
    }
    const links = await this.associateCustomerRepository.find({
      where: { associateId: associateProfile.id },
    });
    return links.map((l) => l.customerId);
  }

  private async assertCanAccessCustomer(actor: JwtActor, customerId: string): Promise<void> {
    if (actor.role === UserRole.ADMIN) {
      return;
    }
    if (actor.role !== UserRole.ASSOCIATE) {
      throw new ForbiddenException('Insufficient permissions');
    }
    const ids = await this.customerIdsForAssociateUser(actor.id);
    if (!ids.includes(customerId)) {
      throw new ForbiddenException('You do not have access to this customer');
    }
  }

  private assertAdminOrAssociate(createdBy?: JwtActor): void {
    if (
      createdBy &&
      createdBy.role !== UserRole.ADMIN &&
      createdBy.role !== UserRole.ASSOCIATE
    ) {
      throw new ForbiddenException('Only Admin or Associate can manage customers');
    }
  }

  private async assertEmailAvailable(normalizedEmail: string): Promise<void> {
    const existing = await this.customerRepository.findOne({ where: { email: normalizedEmail } });
    if (existing) {
      throw new ConflictException('Email already in use');
    }
  }

  private async resolveAssociateAssignmentOnCreate(
    dto: CreateCustomerApiDto,
    actor: JwtActor,
  ): Promise<string | undefined> {
    const requestedAssociateId = dto.associateId?.trim();

    if (actor.role === UserRole.ADMIN) {
      if (!requestedAssociateId) {
        return undefined;
      }
      const associate = await this.associateProfileRepository.findOne({
        where: { id: requestedAssociateId },
      });
      if (!associate) {
        throw new NotFoundException(`Associate #${requestedAssociateId} not found`);
      }
      return associate.id;
    }

    if (actor.role !== UserRole.ASSOCIATE) {
      return undefined;
    }

    const ownAssociateProfile = await this.associateProfileRepository.findOne({
      where: { userId: actor.id },
    });
    if (!ownAssociateProfile) {
      throw new ForbiddenException('Associate profile not found for current user');
    }
    if (requestedAssociateId && requestedAssociateId !== ownAssociateProfile.id) {
      throw new ForbiddenException('Associates can only assign created customers to themselves');
    }
    return ownAssociateProfile.id;
  }

  private async attachAssignedAssociates(
    customers: Array<ReturnType<CustomersService['toCustomerDetail']>>,
  ): Promise<Array<ReturnType<CustomersService['toCustomerDetail']>>> {
    if (!customers.length) {
      return customers;
    }

    const customerIds = customers.map((c) => c.id);
    const links = await this.associateCustomerRepository.find({
      where: { customerId: In(customerIds) },
    });
    const uniqueAssociateIds = [...new Set(links.map((l) => l.associateId))];
    const associates = uniqueAssociateIds.length
      ? await this.associateProfileRepository.find({
          where: { id: In(uniqueAssociateIds) },
        })
      : [];
    const associateById = new Map(associates.map((a) => [a.id, a]));
    const linksByCustomerId = new Map<string, typeof links>();
    for (const link of links) {
      const rows = linksByCustomerId.get(link.customerId) ?? [];
      rows.push(link);
      linksByCustomerId.set(link.customerId, rows);
    }

    return customers.map((customer) => {
      const assignedAssociates = (linksByCustomerId.get(customer.id) ?? [])
        .map((link) => associateById.get(link.associateId))
        .filter((a): a is AssociateProfile => !!a)
        .map((a) => ({
          id: a.id,
          email: a.email ?? '',
          firstName: a.firstName,
          lastName: a.lastName,
          name: `${a.firstName} ${a.lastName}`.trim(),
          role: a.role,
          status: a.status,
        }));
      return { ...customer, assignedAssociates };
    });
  }

  private async resolveApplicationType(input: {
    applicationTypeId?: string;
    applicationTypeCode?: string;
  }): Promise<ApplicationType> {
    if (input.applicationTypeId?.trim()) {
      return this.applicationTypesService.findActiveById(input.applicationTypeId.trim());
    }
    const code = input.applicationTypeCode?.trim();
    if (code) {
      const row = await this.applicationTypesService.findActiveByCode(code);
      if (!row) {
        throw new BadRequestException(`Unknown or inactive application type code: ${code}`);
      }
      return row;
    }
    throw new BadRequestException('Provide applicationTypeId or applicationTypeCode');
  }

  private async resolveApplicationTypeForLegacy(dto: CreateCustomerDto): Promise<ApplicationType> {
    if (dto.applicationTypeId?.trim()) {
      return this.applicationTypesService.findActiveById(dto.applicationTypeId.trim());
    }
    if (dto.applicationTypeCode?.trim()) {
      const row = await this.applicationTypesService.findActiveByCode(dto.applicationTypeCode.trim());
      if (!row) {
        throw new BadRequestException(`Unknown or inactive application type code: ${dto.applicationTypeCode}`);
      }
      return row;
    }
    if (!dto.applicationType?.trim()) {
      throw new BadRequestException(
        'Provide applicationType, applicationTypeId, or applicationTypeCode (see GET /application-types).',
      );
    }
    return this.resolveTypeFromLegacyLabel(dto.applicationType);
  }

  private async resolveTypeFromLegacyLabel(label: string): Promise<ApplicationType> {
    const trimmed = label.trim();
    const slug = trimmed.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    let row = await this.applicationTypesService.findActiveByCode(slug);
    if (row) {
      return row;
    }
    row = await this.applicationTypesService.findActiveByCode(trimmed.toLowerCase());
    if (row) {
      return row;
    }

    const byName = await this.applicationTypesService.findActiveByNameIgnoreCase(trimmed);
    if (byName) {
      return byName;
    }

    throw new BadRequestException(
      `Unknown application type "${trimmed}". Use GET /application-types and send applicationTypeId or applicationTypeCode.`,
    );
  }

  private splitName(name: string): { firstName: string; lastName: string } {
    const trimmed = name.trim();
    const parts = trimmed.split(/\s+/).filter(Boolean);
    if (parts.length === 0) {
      return { firstName: 'Customer', lastName: 'User' };
    }
    if (parts.length === 1) {
      return { firstName: parts[0], lastName: 'Customer' };
    }
    return {
      firstName: parts[0],
      lastName: parts.slice(1).join(' '),
    };
  }

  private toCustomerDetail(customer: CustomerProfile) {
    const applications = (customer.applications ?? [])
      .slice()
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .map((a) => ({
        id: a.id,
        status: a.status,
        pipeline: a.pipeline ?? null,
        createdAt: a.createdAt,
        updatedAt: a.updatedAt,
        applicationType: a.applicationType
          ? {
              id: a.applicationType.id,
              code: a.applicationType.code,
              name: a.applicationType.name,
            }
          : null,
        workflow: this.customerApplicationWorkflowService.buildWorkflowPayload(a),
      }));

    return {
      id: customer.id,
      email: customer.email ?? '',
      firstName: customer.firstName,
      lastName: customer.lastName,
      name: `${customer.firstName} ${customer.lastName}`.trim(),
      phoneNumber: customer.phoneNumber,
      property: customer.property,
      address: customer.address,
      profilePhoto: customer.profilePhoto,
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt,
      applications,
    };
  }
}
