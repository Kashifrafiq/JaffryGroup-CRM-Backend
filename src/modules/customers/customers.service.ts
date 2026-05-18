import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { createHash, randomBytes } from 'crypto';
import { DataSource, In, IsNull, MoreThan, Repository } from 'typeorm';
import { CustomerProfile } from '../users/entities/customer-profile.entity';
import { UserRole } from '../users/entities/user-role.enum';
import { User } from '../users/entities/user.entity';
import { JwtActor } from './jwt-actor.type';
import { AssociateProfile } from '../users/entities/associate-profile.entity';
import { PipelineStepAssignmentService, PipelineStepAssignee } from './pipeline-step-assignment.service';
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
import { InviteCustomerDto } from './dto/invite-customer.dto';
import { CustomerInvite } from './entities/customer-invite.entity';
import { CustomerInviteMailService } from './customer-invite-mail.service';

@Injectable()
export class CustomersService {
  private readonly logger = new Logger(CustomersService.name);

  constructor(
    @InjectRepository(CustomerProfile)
    private readonly customerRepository: Repository<CustomerProfile>,
    @InjectRepository(CustomerApplication)
    private readonly applicationRepository: Repository<CustomerApplication>,
    @InjectRepository(AssociateProfile)
    private readonly associateProfileRepository: Repository<AssociateProfile>,
    private readonly pipelineStepAssignmentService: PipelineStepAssignmentService,
    @InjectRepository(CustomerInvite)
    private readonly customerInviteRepository: Repository<CustomerInvite>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly applicationTypesService: ApplicationTypesService,
    private readonly applicationWorkflowService: ApplicationWorkflowService,
    private readonly customerApplicationWorkflowService: CustomerApplicationWorkflowService,
    private readonly customerInviteMailService: CustomerInviteMailService,
    private readonly configService: ConfigService,
    private readonly dataSource: DataSource,
  ) {}

  async create(
    dto: CreateCustomerApiDto,
    createdBy: JwtActor,
  ): Promise<ReturnType<CustomersService['toCustomerSummary']>> {
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
      return saved;
    });

    if (associateId) {
      await this.pipelineStepAssignmentService.assignAllStepsForCustomerToAssociate(
        customer.id,
        associateId,
      );
    }

    return this.findOneDetail(customer.id, createdBy);
  }

  async inviteCustomer(
    dto: InviteCustomerDto,
    actor: JwtActor,
  ): Promise<{ inviteSent: true; email: string; expiresAt: Date }> {
    this.assertAdminOrAssociate(actor);
    const normalizedEmail = dto.email.trim().toLowerCase();
    await this.assertCustomerEmailAvailableForInvite(normalizedEmail);

    const frontendBase = this.configService
      .get<string>('FRONTEND_CUSTOMER_INVITE_URL_BASE')
      ?.trim();
    if (!frontendBase) {
      throw new BadRequestException('FRONTEND_CUSTOMER_INVITE_URL_BASE is required');
    }

    const token = randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(token);
    const expiresAt = this.getCustomerInviteExpiryDate();
    const inviteLink = `${frontendBase}${frontendBase.includes('?') ? '&' : '?'}token=${token}`;

    const invite = this.customerInviteRepository.create({
      email: normalizedEmail,
      firstName: dto.firstName.trim(),
      lastName: dto.lastName.trim(),
      phoneNumber: null,
      property: null,
      address: null,
      profilePhoto: null,
      tokenHash,
      expiresAt,
      acceptedAt: null,
      createdByUserId: actor.id,
    });
    await this.customerInviteRepository.save(invite);

    try {
      await this.customerInviteMailService.sendCustomerInvite({
        to: normalizedEmail,
        inviteLink,
      });
    } catch (error) {
      await this.customerInviteRepository.delete(invite.id);
      throw error;
    }

    return {
      inviteSent: true,
      email: normalizedEmail,
      expiresAt,
    };
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

  async findAll(actor: JwtActor, query: ListCustomersQueryDto): Promise<ReturnType<CustomersService['toCustomerSummary']>[]> {
    this.assertAdminOrAssociate(actor);

    if (actor.role === UserRole.ADMIN) {
      const customers = await this.queryCustomersWithFiltersForList(query, undefined);
      const details = await Promise.all(customers.map((c) => this.toCustomerSummary(c)));
      return this.attachAssignedAssociates(details);
    }

    const ids = await this.customerIdsForAssociateUser(actor.id);
    if (!ids.length) {
      return [];
    }
    const customers = await this.queryCustomersWithFiltersForList(query, ids);
    const details = await Promise.all(customers.map((c) => this.toCustomerSummary(c)));
    return this.attachAssignedAssociates(details);
  }

  async findMyInfo(userId: string): Promise<{
    id: string;
    name: string;
    email: string;
    applicationType: string | null;
  }> {
    const customer = await this.customerRepository.findOne({
      where: { userId },
      relations: ['applications', 'applications.applicationType'],
    });
    if (!customer) {
      throw new NotFoundException('Customer profile not found for current user');
    }

    const latestApplication = (customer.applications ?? [])
      .slice()
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];

    return {
      id: customer.id,
      name: `${customer.firstName} ${customer.lastName}`.trim(),
      email: customer.email ?? '',
      applicationType: latestApplication?.applicationType?.name ?? customer.applicationType ?? null,
    };
  }

  async findMyPipelineProgress(userId: string): Promise<{
    customerId: string;
    applications: Array<{
      applicationId: string;
      applicationType: { id: string; name: string } | null;
      pipelineSteps: Array<{
        stepIndex: number;
        title: string;
        completed: boolean;
        completedAt: Date | null;
      }>;
    }>;
  }> {
    const customer = await this.customerRepository.findOne({
      where: { userId },
      relations: [
        'applications',
        'applications.applicationType',
        'applications.pipelineProgress',
      ],
    });
    if (!customer) {
      throw new NotFoundException('Customer profile not found for current user');
    }

    const applications = (customer.applications ?? [])
      .slice()
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .map((app) => ({
        applicationId: app.id,
        applicationType: app.applicationType
          ? {
              id: app.applicationType.id,
              name: app.applicationType.name,
            }
          : null,
        pipelineSteps: (app.pipelineProgress ?? [])
          .slice()
          .sort((a, b) => a.stepIndex - b.stepIndex)
          .map((step) => ({
            stepIndex: step.stepIndex,
            title: step.title,
            completed: !!step.completedAt,
            completedAt: step.completedAt ?? null,
          })),
      }));

    return {
      customerId: customer.id,
      applications,
    };
  }

  async findMyDocuments(userId: string): Promise<{
    customerId: string;
    applications: Array<{
      applicationId: string;
      applicationType: { id: string; name: string } | null;
      summary: {
        uploaded: number;
        remaining: number;
        total: number;
      };
      documents: Array<{
        id: string;
        requirementKey: string;
        sectionTitle: string;
        itemLabel: string;
        status: string;
        uploaded: boolean;
        uploadedAt: Date | null;
      }>;
    }>;
  }> {
    const customer = await this.customerRepository.findOne({
      where: { userId },
      relations: [
        'applications',
        'applications.applicationType',
        'applications.applicationDocuments',
        'applications.applicationDocuments.requirement',
      ],
    });
    if (!customer) {
      throw new NotFoundException('Customer profile not found for current user');
    }

    const applications = (customer.applications ?? [])
      .slice()
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .map((app) => {
        const documents = (app.applicationDocuments ?? [])
          .slice()
          .sort((d1, d2) => d1.requirement.sortOrder - d2.requirement.sortOrder)
          .map((doc) => ({
            id: doc.id,
            requirementKey: doc.requirement.requirementKey,
            sectionTitle: doc.requirement.sectionTitle,
            itemLabel: doc.requirement.itemLabel,
            status: doc.status,
            uploaded: !!doc.uploadedAt,
            uploadedAt: doc.uploadedAt ?? null,
          }));

        const uploaded = documents.filter((d) => d.uploaded).length;
        const total = documents.length;
        const remaining = total - uploaded;

        return {
          applicationId: app.id,
          applicationType: app.applicationType
            ? {
                id: app.applicationType.id,
                name: app.applicationType.name,
              }
            : null,
          summary: {
            uploaded,
            remaining,
            total,
          },
          documents,
        };
      });

    return {
      customerId: customer.id,
      applications,
    };
  }

  async findOneDetail(customerId: string, actor: JwtActor): Promise<ReturnType<CustomersService['toCustomerSummary']>> {
    this.assertAdminOrAssociate(actor);
    await this.assertCanAccessCustomer(actor, customerId);
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
    const detail = await this.toCustomerSummary(customer, true);
    const [withAssociates] = await this.attachAssignedAssociates([detail]);
    return withAssociates;
  }

  async updateCustomer(
    customerId: string,
    dto: UpdateCustomerDto,
    actor: JwtActor,
  ): Promise<ReturnType<CustomersService['toCustomerSummary']>> {
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
  ): Promise<ReturnType<CustomersService['toCustomerSummary']>> {
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
  ): Promise<ReturnType<CustomersService['toCustomerSummary']>> {
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
      .leftJoinAndSelect('app.pipelineProgress', 'prog')
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
    return this.pipelineStepAssignmentService.getCustomerIdsForAssociate(associateProfile.id);
  }

  private async assertCanAccessCustomer(actor: JwtActor, customerId: string): Promise<void> {
    if (actor.role === UserRole.ADMIN) {
      return;
    }
    if (actor.role !== UserRole.ASSOCIATE) {
      throw new ForbiddenException('Insufficient permissions');
    }
    const associateProfile = await this.associateProfileRepository.findOne({
      where: { userId: actor.id },
    });
    if (!associateProfile) {
      throw new ForbiddenException('You do not have access to this customer');
    }
    const allowed = await this.pipelineStepAssignmentService.hasAccessToCustomer(
      associateProfile.id,
      customerId,
    );
    if (!allowed) {
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

  private async assertCustomerEmailAvailableForInvite(normalizedEmail: string): Promise<void> {
    const [existingCustomer, existingUser, existingInvite] = await Promise.all([
      this.customerRepository.findOne({ where: { email: normalizedEmail } }),
      this.userRepository.findOne({ where: { email: normalizedEmail } }),
      this.customerInviteRepository.findOne({
        where: {
          email: normalizedEmail,
          acceptedAt: IsNull(),
          expiresAt: MoreThan(new Date()),
        },
      }),
    ]);
    if (!existingCustomer) {
      throw new NotFoundException('Customer does not exist. Create customer first before inviting.');
    }
    if (existingCustomer.userId || existingUser) {
      throw new ConflictException('Email already in use');
    }
    if (existingInvite) {
      throw new ConflictException('An active invite already exists for this email');
    }
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private getCustomerInviteExpiryDate(): Date {
    const hoursRaw = this.configService.get<string>('CUSTOMER_INVITE_EXPIRES_HOURS', '48');
    const hours = Number(hoursRaw);
    const safeHours = Number.isFinite(hours) && hours > 0 ? hours : 48;
    return new Date(Date.now() + safeHours * 60 * 60 * 1000);
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
    customers: Array<ReturnType<CustomersService['toCustomerSummary']>>,
  ): Promise<Array<ReturnType<CustomersService['toCustomerSummary']>>> {
    if (!customers.length) {
      return customers;
    }

    try {
      const enriched = await Promise.all(
        customers.map(async (customer) => {
          const assigneesByApp =
            await this.pipelineStepAssignmentService.getAssigneesForCustomerApplications(
              customer.id,
            );
          const applications = customer.applications.map((app) => {
            const stepAssignees = assigneesByApp.get(app.applicationId) ?? new Map();
            const pipelineSteps = (app.pipelineSteps ?? []).map((step) => ({
              ...step,
              assignedTo: stepAssignees.get(step.stepIndex) ?? [],
            }));
            const assignedTo = this.uniqueAssignees(pipelineSteps.flatMap((s) => s.assignedTo));
            return { ...app, pipelineSteps, assignedTo };
          });
          const assignedTo = this.uniqueAssignees(applications.flatMap((a) => a.assignedTo));
          return { ...customer, applications, assignedTo };
        }),
      );
      return enriched;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.warn(`Could not load pipeline step assignments: ${message}`);
      return customers.map((customer) => ({ ...customer, assignedTo: [] }));
    }
  }

  private uniqueAssignees(assignees: PipelineStepAssignee[]): PipelineStepAssignee[] {
    const seen = new Set<string>();
    const result: PipelineStepAssignee[] = [];
    for (const assignee of assignees) {
      if (seen.has(assignee.id)) {
        continue;
      }
      seen.add(assignee.id);
      result.push(assignee);
    }
    return result;
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

  private toCustomerSummary(customer: CustomerProfile, includeDocuments = false) {
    const applications = (customer.applications ?? [])
      .slice()
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .map((a) => ({
        applicationId: a.id,
        applicationType: a.applicationType
          ? {
              id: a.applicationType.id,
              name: a.applicationType.name,
            }
          : null,
        progress: {
          completedSteps: (a.pipelineProgress ?? []).filter((p) => !!p.completedAt).length,
          totalSteps: (a.pipelineProgress ?? []).length,
        },
        pipelineSteps: (a.pipelineProgress ?? [])
          .slice()
          .sort((p1, p2) => p1.stepIndex - p2.stepIndex)
          .map((p) => ({
            stepIndex: p.stepIndex,
            title: p.title,
            completedAt: p.completedAt ?? null,
            assignedTo: [] as PipelineStepAssignee[],
          })),
        assignedTo: [] as PipelineStepAssignee[],
        documents: includeDocuments
          ? (a.applicationDocuments ?? [])
              .slice()
              .sort((d1, d2) => d1.requirement.sortOrder - d2.requirement.sortOrder)
              .map((d) => ({
                id: d.id,
                requirementKey: d.requirement.requirementKey,
                itemLabel: d.requirement.itemLabel,
                status: d.status,
                storageKey: d.storageKey ?? null,
                bucket: d.bucket ?? null,
                originalFilename: d.originalFilename ?? null,
                mimeType: d.mimeType ?? null,
                uploadedAt: d.uploadedAt ?? null,
              }))
          : undefined,
      }));

    return {
      id: customer.id,
      profilePhoto: customer.profilePhoto,
      name: `${customer.firstName} ${customer.lastName}`.trim(),
      email: customer.email ?? '',
      applications,
    };
  }
}
