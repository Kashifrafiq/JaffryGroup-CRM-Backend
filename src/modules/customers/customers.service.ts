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
import { DataSource, EntityManager, In, IsNull, MoreThan, Repository } from 'typeorm';
import { CustomerProfile } from '../users/entities/customer-profile.entity';
import { UserRole } from '../users/entities/user-role.enum';
import { User } from '../users/entities/user.entity';
import { JwtActor } from './jwt-actor.type';
import { AssociateProfile } from '../users/entities/associate-profile.entity';
import { PipelineStepAssignmentService, PipelineStepAssignee } from './pipeline-step-assignment.service';
import { DocumentAssignmentService, DocumentAssignee } from './document-assignment.service';
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
import {
  canCustomerPreviewDocument,
  isDocumentFileUploaded,
  isUploadedByCustomerUser,
  mapVisibleCustomerFiles,
} from './customer-document-visibility';

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
    private readonly documentAssignmentService: DocumentAssignmentService,
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
  ): Promise<Awaited<ReturnType<CustomersService['toCustomerSummary']>>> {
    this.assertAdminOrAssociate(createdBy);
    this.assertHasApplicationTypeInput(dto);
    const appTypes = await this.resolveApplicationTypes({
      applicationTypeId: dto.applicationTypeId,
      applicationTypeCode: dto.applicationTypeCode,
      applicationTypeIds: dto.applicationTypeIds,
      applicationTypeCodes: dto.applicationTypeCodes,
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

      await this.instantiateApplicationsForCustomer(em, saved.id, appTypes, {
        status: dto.status ?? CustomerApplicationStatus.DRAFT,
      });
      return saved;
    });

    if (associateId) {
      await this.pipelineStepAssignmentService.assignAllStepsForCustomerToAssociate(
        customer.id,
        associateId,
      );
    }

    if (dto.documentAssignments?.length) {
      await this.documentAssignmentService.applyAssignmentsOnCreate(
        customer.id,
        dto.documentAssignments,
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

    const appTypes = await this.resolveApplicationTypesForLegacy(dto);

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

      await this.instantiateApplicationsForCustomer(em, saved.id, appTypes, {
        status: CustomerApplicationStatus.DRAFT,
      });

      return saved;
    });
  }

  async findAll(actor: JwtActor, query: ListCustomersQueryDto): Promise<Awaited<ReturnType<CustomersService['toCustomerSummary']>>[]> {
    this.assertAdminOrAssociate(actor);

    if (actor.role === UserRole.ADMIN) {
      const customers = await this.queryCustomersWithFiltersForList(query, undefined);
      const details = await Promise.all(customers.map((c) => this.toCustomerSummary(c, false, actor)));
      return this.attachAssignedAssociates(details);
    }

    const ids = await this.customerIdsForAssociateUser(actor.id);
    if (!ids.length) {
      return [];
    }
    const customers = await this.queryCustomersWithFiltersForList(query, ids);
    const details = await Promise.all(customers.map((c) => this.toCustomerSummary(c, false, actor)));
    return this.attachAssignedAssociates(details);
  }

  async findMyInfo(userId: string): Promise<{
    id: string;
    name: string;
    email: string;
    applications: Array<{
      applicationId: string;
      applicationType: { id: string; name: string } | null;
    }>;
  }> {
    const customer = await this.customerRepository.findOne({
      where: { userId },
      relations: ['applications', 'applications.applicationType'],
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
      }));

    return {
      id: customer.id,
      name: `${customer.firstName} ${customer.lastName}`.trim(),
      email: customer.email ?? '',
      applications,
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
        uploadedByMe: boolean;
        uploadedAt: Date | null;
        canPreview: boolean;
        originalFilename: string | null;
        fileCount: number;
        files: Array<{
          id: string;
          originalFilename: string | null;
          uploadedAt: Date | null;
          uploadedByMe: boolean;
          canPreview: boolean;
        }>;
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
        'applications.applicationDocuments.files',
      ],
    });
    if (!customer) {
      throw new NotFoundException('Customer profile not found for current user');
    }

    const uploaderRoleByUserId = await this.uploaderRoleMapForDocuments(
      (customer.applications ?? []).flatMap((app) => app.applicationDocuments ?? []),
    );

    const applications = (customer.applications ?? [])
      .slice()
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .map((app) => {
        const documents = (app.applicationDocuments ?? [])
          .slice()
          .sort((d1, d2) => d1.requirement.sortOrder - d2.requirement.sortOrder)
          .map((doc) => {
            const customerFiles = mapVisibleCustomerFiles(
              doc.files ?? [],
              userId,
              uploaderRoleByUserId,
            );
            const legacyUploadedByMe = isUploadedByCustomerUser(doc, userId, uploaderRoleByUserId);
            const hasAnyUpload =
              (doc.files ?? []).some((f) => !!f.uploadedAt && !!f.storageKey) ||
              isDocumentFileUploaded(doc);
            const uploaded = hasAnyUpload;
            const uploadedByMe = customerFiles.length > 0 || legacyUploadedByMe;
            return {
              id: doc.id,
              requirementKey: doc.requirement.requirementKey,
              sectionTitle: doc.requirement.sectionTitle,
              itemLabel: doc.requirement.itemLabel,
              status: doc.status,
              uploaded,
              uploadedByMe,
              uploadedAt: uploadedByMe
                ? customerFiles[0]?.uploadedAt ?? doc.uploadedAt ?? null
                : null,
              canPreview:
                customerFiles.some((f) => f.canPreview) ||
                canCustomerPreviewDocument(doc, userId, uploaderRoleByUserId),
              originalFilename: uploadedByMe
                ? customerFiles[0]?.originalFilename ?? doc.originalFilename ?? null
                : null,
              fileCount:
                customerFiles.length +
                (legacyUploadedByMe && doc.storageKey ? 1 : 0),
              files: customerFiles,
            };
          });

        const uploaded = documents.filter((d) => d.uploaded).length;
        const total = documents.length;
        const remaining = documents.filter((d) => !d.uploaded).length;

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

  async findCustomerDocuments(
    customerId: string,
    actor: JwtActor,
    query: { associateId: string; applicationId?: string },
  ): Promise<{
    customerId: string;
    customerName: string;
    associateId: string;
    associateName: string;
    applications: Array<{
      applicationId: string;
      applicationType: { id: string; code: string; name: string } | null;
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
        sortOrder: number;
        status: string;
        uploaded: boolean;
        fileCount: number;
        storageKey: string | null;
        bucket: string | null;
        originalFilename: string | null;
        mimeType: string | null;
        sizeBytes: string | null;
        uploadedAt: Date | null;
        uploadedByUserId: string | null;
        notes: string | null;
        assignedTo: DocumentAssignee[];
        files: Array<{
          id: string;
          storageKey: string | null;
          bucket: string | null;
          originalFilename: string | null;
          mimeType: string | null;
          sizeBytes: string | null;
          uploadedAt: Date | null;
          uploadedByUserId: string | null;
        }>;
      }>;
    }>;
  }> {
    this.assertAdminOrAssociate(actor);
    await this.assertCanAccessCustomer(actor, customerId);

    const associateId = query.associateId.trim();
    const associate = await this.associateProfileRepository.findOne({
      where: { id: associateId },
    });
    if (!associate) {
      throw new NotFoundException(`Associate #${associateId} not found`);
    }

    if (actor.role === UserRole.ASSOCIATE) {
      const ownProfile = await this.associateProfileRepository.findOne({
        where: { userId: actor.id },
      });
      if (!ownProfile || ownProfile.id !== associateId) {
        throw new ForbiddenException('Associates can only load documents for their own profile');
      }
    }

    const customer = await this.customerRepository.findOne({
      where: { id: customerId },
      relations: [
        'applications',
        'applications.applicationType',
        'applications.applicationDocuments',
        'applications.applicationDocuments.requirement',
        'applications.applicationDocuments.files',
      ],
    });
    if (!customer) {
      throw new NotFoundException(`Customer #${customerId} not found`);
    }

    const assignedDocumentIds =
      await this.documentAssignmentService.getAssignedDocumentIdsForAssociate(
        associateId,
        customerId,
      );

    const applicationFilter = query.applicationId?.trim();
    const apps = (customer.applications ?? [])
      .filter((app) => !applicationFilter || app.id === applicationFilter)
      .slice()
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    if (applicationFilter && !apps.length) {
      throw new NotFoundException(
        `Application #${applicationFilter} not found for customer #${customerId}`,
      );
    }

    const allDocumentIds = apps.flatMap((app) =>
      (app.applicationDocuments ?? []).map((doc) => doc.id),
    );
    const documentAssigneesById =
      actor.role === UserRole.ADMIN
        ? await this.documentAssignmentService.getAssigneesByDocumentIds(allDocumentIds)
        : new Map<string, DocumentAssignee[]>();

    const assignedDocumentIdSet = new Set(assignedDocumentIds);

    const applications = apps.map((app) => {
      const documents = (app.applicationDocuments ?? [])
        .slice()
        .sort((d1, d2) => d1.requirement.sortOrder - d2.requirement.sortOrder)
        .filter((doc) => assignedDocumentIdSet.has(doc.id))
        .map((doc) => {
          const attachmentFiles = (doc.files ?? []).filter(
            (f) => !!f.uploadedAt && !!f.storageKey,
          );
          const uploaded =
            attachmentFiles.length > 0 || isDocumentFileUploaded(doc);
          return {
            id: doc.id,
            requirementKey: doc.requirement.requirementKey,
            sectionTitle: doc.requirement.sectionTitle,
            itemLabel: doc.requirement.itemLabel,
            sortOrder: doc.requirement.sortOrder,
            status: doc.status,
            uploaded,
            fileCount: attachmentFiles.length + (doc.uploadedAt && doc.storageKey ? 1 : 0),
            storageKey: doc.storageKey ?? null,
            bucket: doc.bucket ?? null,
            originalFilename: doc.originalFilename ?? null,
            mimeType: doc.mimeType ?? null,
            sizeBytes: doc.sizeBytes ?? null,
            uploadedAt: doc.uploadedAt ?? null,
            uploadedByUserId: doc.uploadedByUserId ?? null,
            notes: doc.notes ?? null,
            assignedTo: documentAssigneesById.get(doc.id) ?? [],
            files: attachmentFiles.map((f) => ({
              id: f.id,
              storageKey: f.storageKey ?? null,
              bucket: f.bucket ?? null,
              originalFilename: f.originalFilename ?? null,
              mimeType: f.mimeType ?? null,
              sizeBytes: f.sizeBytes ?? null,
              uploadedAt: f.uploadedAt ?? null,
              uploadedByUserId: f.uploadedByUserId ?? null,
            })),
          };
        });

      const uploaded = documents.filter((d) => d.uploaded).length;
      const total = documents.length;

      return {
        applicationId: app.id,
        applicationType: app.applicationType
          ? {
              id: app.applicationType.id,
              code: app.applicationType.code,
              name: app.applicationType.name,
            }
          : null,
        summary: {
          uploaded,
          remaining: total - uploaded,
          total,
        },
        documents,
      };
    });

    return {
      customerId: customer.id,
      customerName: `${customer.firstName} ${customer.lastName}`.trim(),
      associateId: associate.id,
      associateName: `${associate.firstName} ${associate.lastName}`.trim(),
      applications,
    };
  }

  async findCustomerPipelineSteps(
    customerId: string,
    actor: JwtActor,
    query: { associateId: string; applicationId?: string },
  ): Promise<{
    customerId: string;
    customerName: string;
    associateId: string;
    associateName: string;
    applications: Array<{
      applicationId: string;
      applicationType: { id: string; code: string; name: string } | null;
      summary: {
        completedSteps: number;
        totalSteps: number;
      };
      pipelineSteps: Array<{
        stepIndex: number;
        title: string;
        completedAt: Date | null;
        assignedTo: PipelineStepAssignee[];
      }>;
    }>;
  }> {
    this.assertAdminOrAssociate(actor);
    await this.assertCanAccessCustomer(actor, customerId);

    const associateId = query.associateId.trim();
    const associate = await this.associateProfileRepository.findOne({
      where: { id: associateId },
    });
    if (!associate) {
      throw new NotFoundException(`Associate #${associateId} not found`);
    }

    if (actor.role === UserRole.ASSOCIATE) {
      const ownProfile = await this.associateProfileRepository.findOne({
        where: { userId: actor.id },
      });
      if (!ownProfile || ownProfile.id !== associateId) {
        throw new ForbiddenException('Associates can only load pipeline steps for their own profile');
      }
    }

    const customer = await this.customerRepository.findOne({
      where: { id: customerId },
      relations: [
        'applications',
        'applications.applicationType',
        'applications.pipelineProgress',
      ],
    });
    if (!customer) {
      throw new NotFoundException(`Customer #${customerId} not found`);
    }

    const assignedProgressIds =
      await this.pipelineStepAssignmentService.getAssignedPipelineProgressIdsForAssociate(
        associateId,
        customerId,
        query.applicationId,
      );
    const assignedProgressIdSet = new Set(assignedProgressIds);

    const applicationFilter = query.applicationId?.trim();
    const apps = (customer.applications ?? [])
      .filter((app) => !applicationFilter || app.id === applicationFilter)
      .slice()
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    if (applicationFilter && !apps.length) {
      throw new NotFoundException(
        `Application #${applicationFilter} not found for customer #${customerId}`,
      );
    }

    const allProgressIds = apps.flatMap((app) =>
      (app.pipelineProgress ?? []).map((step) => step.id),
    );
    const assigneesByProgressId =
      actor.role === UserRole.ADMIN
        ? await this.pipelineStepAssignmentService.getAssigneesByProgressIds(allProgressIds)
        : new Map<string, PipelineStepAssignee[]>();

    const applications = apps.map((app) => {
      const pipelineSteps = (app.pipelineProgress ?? [])
        .slice()
        .sort((a, b) => a.stepIndex - b.stepIndex)
        .filter((step) => assignedProgressIdSet.has(step.id))
        .map((step) => ({
          stepIndex: step.stepIndex,
          title: step.title,
          completedAt: step.completedAt ?? null,
          assignedTo: assigneesByProgressId.get(step.id) ?? [],
        }));

      return {
        applicationId: app.id,
        applicationType: app.applicationType
          ? {
              id: app.applicationType.id,
              code: app.applicationType.code,
              name: app.applicationType.name,
            }
          : null,
        summary: {
          completedSteps: pipelineSteps.filter((s) => !!s.completedAt).length,
          totalSteps: pipelineSteps.length,
        },
        pipelineSteps,
      };
    });

    return {
      customerId: customer.id,
      customerName: `${customer.firstName} ${customer.lastName}`.trim(),
      associateId: associate.id,
      associateName: `${associate.firstName} ${associate.lastName}`.trim(),
      applications,
    };
  }

  async findOneDetail(customerId: string, actor: JwtActor): Promise<Awaited<ReturnType<CustomersService['toCustomerSummary']>>> {
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
        'applications.applicationDocuments.files',
      ],
    });
    if (!customer) {
      throw new NotFoundException(`Customer #${customerId} not found`);
    }
    const detail = await this.toCustomerSummary(customer, true, actor);
    const [withAssociates] = await this.attachAssignedAssociates([detail]);
    return withAssociates;
  }

  async updateCustomer(
    customerId: string,
    dto: UpdateCustomerDto,
    actor: JwtActor,
  ): Promise<Awaited<ReturnType<CustomersService['toCustomerSummary']>>> {
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

    if (dto.documentAssignments?.length) {
      await this.documentAssignmentService.applyAssignmentsOnUpdate(
        customerId,
        dto.documentAssignments,
      );
    }

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
  ): Promise<Awaited<ReturnType<CustomersService['toCustomerSummary']>>> {
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

    await this.dataSource.transaction(async (em) => {
      const app = await em.save(
        CustomerApplication,
        em.create(CustomerApplication, {
          customerId,
          applicationTypeId: appType.id,
          status: dto.status ?? CustomerApplicationStatus.DRAFT,
        }),
      );
      await this.applicationWorkflowService.instantiateForNewApplication(
        em,
        app.id,
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
  ): Promise<Awaited<ReturnType<CustomersService['toCustomerSummary']>>> {
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
    const [pipelineCustomerIds, documentCustomerIds] = await Promise.all([
      this.pipelineStepAssignmentService.getCustomerIdsForAssociate(associateProfile.id),
      this.documentAssignmentService.getCustomerIdsForAssociate(associateProfile.id),
    ]);
    return [...new Set([...pipelineCustomerIds, ...documentCustomerIds])];
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
    const [pipelineAllowed, documentAllowed] = await Promise.all([
      this.pipelineStepAssignmentService.hasAccessToCustomer(associateProfile.id, customerId),
      this.documentAssignmentService.hasAccessToCustomer(associateProfile.id, customerId),
    ]);
    if (!pipelineAllowed && !documentAllowed) {
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
    customers: Array<Awaited<ReturnType<CustomersService['toCustomerSummary']>>>,
  ): Promise<Array<Awaited<ReturnType<CustomersService['toCustomerSummary']>>>> {
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

  private assertHasApplicationTypeInput(input: {
    applicationTypeId?: string;
    applicationTypeCode?: string;
    applicationTypeIds?: string[];
    applicationTypeCodes?: string[];
  }): void {
    const hasSingle =
      !!input.applicationTypeId?.trim() || !!input.applicationTypeCode?.trim();
    const hasArray =
      (input.applicationTypeIds?.some((id) => id?.trim()) ?? false) ||
      (input.applicationTypeCodes?.some((code) => code?.trim()) ?? false);
    if (!hasSingle && !hasArray) {
      throw new BadRequestException(
        'Provide applicationTypeId, applicationTypeCode, applicationTypeIds, or applicationTypeCodes',
      );
    }
  }

  private async instantiateApplicationsForCustomer(
    em: EntityManager,
    customerId: string,
    appTypes: ApplicationType[],
    defaults: {
      status: CustomerApplicationStatus;
    },
  ): Promise<void> {
    for (const appType of appTypes) {
      const app = await em.save(
        CustomerApplication,
        em.create(CustomerApplication, {
          customerId,
          applicationTypeId: appType.id,
          status: defaults.status,
        }),
      );
      await this.applicationWorkflowService.instantiateForNewApplication(
        em,
        app.id,
        appType.id,
      );
    }
  }

  private async resolveApplicationTypes(input: {
    applicationTypeId?: string;
    applicationTypeCode?: string;
    applicationTypeIds?: string[];
    applicationTypeCodes?: string[];
  }): Promise<ApplicationType[]> {
    const specs: Array<{ applicationTypeId?: string; applicationTypeCode?: string }> = [];

    if (input.applicationTypeId?.trim()) {
      specs.push({ applicationTypeId: input.applicationTypeId.trim() });
    }
    if (input.applicationTypeCode?.trim()) {
      specs.push({ applicationTypeCode: input.applicationTypeCode.trim() });
    }
    for (const id of input.applicationTypeIds ?? []) {
      if (id?.trim()) {
        specs.push({ applicationTypeId: id.trim() });
      }
    }
    for (const code of input.applicationTypeCodes ?? []) {
      if (code?.trim()) {
        specs.push({ applicationTypeCode: code.trim() });
      }
    }

    if (!specs.length) {
      throw new BadRequestException(
        'Provide applicationTypeId, applicationTypeCode, applicationTypeIds, or applicationTypeCodes',
      );
    }

    const resolved: ApplicationType[] = [];
    for (const spec of specs) {
      resolved.push(await this.resolveApplicationType(spec));
    }
    return resolved;
  }

  private async resolveApplicationTypesForLegacy(dto: CreateCustomerDto): Promise<ApplicationType[]> {
    const specs: Array<{ applicationTypeId?: string; applicationTypeCode?: string }> = [];

    if (dto.applicationTypeId?.trim()) {
      specs.push({ applicationTypeId: dto.applicationTypeId.trim() });
    }
    if (dto.applicationTypeCode?.trim()) {
      specs.push({ applicationTypeCode: dto.applicationTypeCode.trim() });
    }
    for (const id of dto.applicationTypeIds ?? []) {
      if (id?.trim()) {
        specs.push({ applicationTypeId: id.trim() });
      }
    }
    for (const code of dto.applicationTypeCodes ?? []) {
      if (code?.trim()) {
        specs.push({ applicationTypeCode: code.trim() });
      }
    }

    if (specs.length) {
      const resolved: ApplicationType[] = [];
      for (const spec of specs) {
        resolved.push(await this.resolveApplicationType(spec));
      }
      return resolved;
    }

    if (!dto.applicationType?.trim()) {
      throw new BadRequestException(
        'Provide applicationType, applicationTypeId, applicationTypeCode, applicationTypeIds, or applicationTypeCodes (see GET /application-types).',
      );
    }
    return [await this.resolveTypeFromLegacyLabel(dto.applicationType)];
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

  private async uploaderRoleMapForDocuments(
    documents: Array<{
      uploadedByUserId?: string | null;
      files?: Array<{ uploadedByUserId?: string | null }>;
    }>,
  ): Promise<Map<string, UserRole>> {
    const uploaderIds = [
      ...new Set(
        documents
          .flatMap((d) => [
            d.uploadedByUserId?.trim(),
            ...(d.files ?? []).map((f) => f.uploadedByUserId?.trim()),
          ])
          .filter((id): id is string => !!id),
      ),
    ];
    if (!uploaderIds.length) {
      return new Map();
    }
    const users = await this.userRepository.find({
      where: { id: In(uploaderIds) },
      select: ['id', 'role'],
    });
    return new Map(users.map((u) => [u.id, u.role]));
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

  private async toCustomerSummary(
    customer: CustomerProfile,
    includeDocuments = false,
    actor?: JwtActor,
  ) {
    let assignedDocumentIds: string[] | null = null;
    if (actor?.role === UserRole.ASSOCIATE) {
      const profile = await this.associateProfileRepository.findOne({
        where: { userId: actor.id },
      });
      assignedDocumentIds = profile
        ? await this.documentAssignmentService.getAssignedDocumentIdsForAssociate(
            profile.id,
            customer.id,
          )
        : [];
    }

    const documentAssigneesById =
      includeDocuments && actor?.role !== UserRole.ASSOCIATE
        ? await this.documentAssignmentService.getAssigneesByDocumentIds(
            (customer.applications ?? []).flatMap((app) =>
              (app.applicationDocuments ?? []).map((doc) => doc.id),
            ),
          )
        : new Map<string, DocumentAssignee[]>();

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
                .filter((d) => {
                  if (assignedDocumentIds === null) {
                    return true;
                  }
                  return assignedDocumentIds.includes(d.id);
                })
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
                  assignedTo: documentAssigneesById.get(d.id) ?? [],
                  files: (d.files ?? [])
                    .filter((f) => !!f.uploadedAt && !!f.storageKey)
                    .map((f) => ({
                      id: f.id,
                      storageKey: f.storageKey ?? null,
                      bucket: f.bucket ?? null,
                      originalFilename: f.originalFilename ?? null,
                      mimeType: f.mimeType ?? null,
                      sizeBytes: f.sizeBytes ?? null,
                      uploadedAt: f.uploadedAt ?? null,
                      uploadedByUserId: f.uploadedByUserId ?? null,
                    })),
                }))
            : undefined,
      }));

    return {
      id: customer.id,
      profilePhoto: customer.profilePhoto ?? null,
      name: `${customer.firstName} ${customer.lastName}`.trim(),
      email: customer.email ?? '',
      phone: customer.phoneNumber ?? null,
      property: customer.property ?? null,
      address: customer.address ?? null,
      applications,
    };
  }
}
