"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var CustomersService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const config_1 = require("@nestjs/config");
const crypto_1 = require("crypto");
const typeorm_2 = require("typeorm");
const customer_profile_entity_1 = require("../users/entities/customer-profile.entity");
const user_role_enum_1 = require("../users/entities/user-role.enum");
const user_entity_1 = require("../users/entities/user.entity");
const associate_profile_entity_1 = require("../users/entities/associate-profile.entity");
const pipeline_step_assignment_service_1 = require("./pipeline-step-assignment.service");
const customer_application_entity_1 = require("./entities/customer-application.entity");
const customer_application_status_enum_1 = require("./entities/customer-application-status.enum");
const application_types_service_1 = require("../applications/application-types.service");
const application_workflow_service_1 = require("../applications/application-workflow.service");
const customer_application_pipeline_progress_entity_1 = require("../applications/entities/customer-application-pipeline-progress.entity");
const customer_application_document_entity_1 = require("../applications/entities/customer-application-document.entity");
const customer_application_workflow_service_1 = require("./customer-application-workflow.service");
const customer_invite_entity_1 = require("./entities/customer-invite.entity");
const customer_invite_mail_service_1 = require("./customer-invite-mail.service");
let CustomersService = CustomersService_1 = class CustomersService {
    customerRepository;
    applicationRepository;
    associateProfileRepository;
    pipelineStepAssignmentService;
    customerInviteRepository;
    userRepository;
    applicationTypesService;
    applicationWorkflowService;
    customerApplicationWorkflowService;
    customerInviteMailService;
    configService;
    dataSource;
    logger = new common_1.Logger(CustomersService_1.name);
    constructor(customerRepository, applicationRepository, associateProfileRepository, pipelineStepAssignmentService, customerInviteRepository, userRepository, applicationTypesService, applicationWorkflowService, customerApplicationWorkflowService, customerInviteMailService, configService, dataSource) {
        this.customerRepository = customerRepository;
        this.applicationRepository = applicationRepository;
        this.associateProfileRepository = associateProfileRepository;
        this.pipelineStepAssignmentService = pipelineStepAssignmentService;
        this.customerInviteRepository = customerInviteRepository;
        this.userRepository = userRepository;
        this.applicationTypesService = applicationTypesService;
        this.applicationWorkflowService = applicationWorkflowService;
        this.customerApplicationWorkflowService = customerApplicationWorkflowService;
        this.customerInviteMailService = customerInviteMailService;
        this.configService = configService;
        this.dataSource = dataSource;
    }
    async create(dto, createdBy) {
        this.assertAdminOrAssociate(createdBy);
        if (!dto.applicationTypeId && !dto.applicationTypeCode) {
            throw new common_1.BadRequestException('Provide applicationTypeId or applicationTypeCode');
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
            const c = em.create(customer_profile_entity_1.CustomerProfile, {
                email: normalizedEmail,
                role: user_role_enum_1.UserRole.CUSTOMER,
                firstName,
                lastName,
                phoneNumber: phone,
                property: dto.property.trim(),
                address: dto.address,
                profilePhoto: dto.profilePhoto,
            });
            const saved = await em.save(customer_profile_entity_1.CustomerProfile, c);
            const app = em.create(customer_application_entity_1.CustomerApplication, {
                customerId: saved.id,
                applicationTypeId: appType.id,
                status: dto.status ?? customer_application_status_enum_1.CustomerApplicationStatus.DRAFT,
                pipeline: dto.pipeline ?? null,
            });
            const savedApp = await em.save(customer_application_entity_1.CustomerApplication, app);
            await this.applicationWorkflowService.instantiateForNewApplication(em, savedApp.id, appType.id);
            return saved;
        });
        if (associateId) {
            await this.pipelineStepAssignmentService.assignAllStepsForCustomerToAssociate(customer.id, associateId);
        }
        return this.findOneDetail(customer.id, createdBy);
    }
    async inviteCustomer(dto, actor) {
        this.assertAdminOrAssociate(actor);
        const normalizedEmail = dto.email.trim().toLowerCase();
        await this.assertCustomerEmailAvailableForInvite(normalizedEmail);
        const frontendBase = this.configService
            .get('FRONTEND_CUSTOMER_INVITE_URL_BASE')
            ?.trim();
        if (!frontendBase) {
            throw new common_1.BadRequestException('FRONTEND_CUSTOMER_INVITE_URL_BASE is required');
        }
        const token = (0, crypto_1.randomBytes)(32).toString('hex');
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
        }
        catch (error) {
            await this.customerInviteRepository.delete(invite.id);
            throw error;
        }
        return {
            inviteSent: true,
            email: normalizedEmail,
            expiresAt,
        };
    }
    async createFromLegacyDto(dto, createdBy) {
        this.assertAdminOrAssociate(createdBy);
        const effectiveRole = dto.role ?? user_role_enum_1.UserRole.CUSTOMER;
        if (effectiveRole !== user_role_enum_1.UserRole.CUSTOMER) {
            throw new common_1.ForbiddenException('Role must be customer');
        }
        const appType = await this.resolveApplicationTypeForLegacy(dto);
        const normalizedEmail = dto.email.trim().toLowerCase();
        await this.assertEmailAvailable(normalizedEmail);
        const phone = dto.phone?.trim() ?? '';
        if (!phone) {
            throw new common_1.BadRequestException('Phone is required');
        }
        const { firstName, lastName } = this.splitName(dto.name);
        return this.dataSource.transaction(async (em) => {
            const c = em.create(customer_profile_entity_1.CustomerProfile, {
                email: normalizedEmail,
                role: user_role_enum_1.UserRole.CUSTOMER,
                firstName,
                lastName,
                phoneNumber: phone,
                property: dto.property.trim(),
                address: dto.address,
                profilePhoto: dto.profilePhoto,
            });
            const saved = await em.save(customer_profile_entity_1.CustomerProfile, c);
            const legacyApp = await em.save(customer_application_entity_1.CustomerApplication, em.create(customer_application_entity_1.CustomerApplication, {
                customerId: saved.id,
                applicationTypeId: appType.id,
                status: customer_application_status_enum_1.CustomerApplicationStatus.DRAFT,
                pipeline: null,
            }));
            await this.applicationWorkflowService.instantiateForNewApplication(em, legacyApp.id, appType.id);
            return saved;
        });
    }
    async findAll(actor, query) {
        this.assertAdminOrAssociate(actor);
        if (actor.role === user_role_enum_1.UserRole.ADMIN) {
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
    async findMyInfo(userId) {
        const customer = await this.customerRepository.findOne({
            where: { userId },
            relations: ['applications', 'applications.applicationType'],
        });
        if (!customer) {
            throw new common_1.NotFoundException('Customer profile not found for current user');
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
    async findMyPipelineProgress(userId) {
        const customer = await this.customerRepository.findOne({
            where: { userId },
            relations: [
                'applications',
                'applications.applicationType',
                'applications.pipelineProgress',
            ],
        });
        if (!customer) {
            throw new common_1.NotFoundException('Customer profile not found for current user');
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
    async findMyDocuments(userId) {
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
            throw new common_1.NotFoundException('Customer profile not found for current user');
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
    async findOneDetail(customerId, actor) {
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
            throw new common_1.NotFoundException(`Customer #${customerId} not found`);
        }
        const detail = await this.toCustomerSummary(customer, true);
        const [withAssociates] = await this.attachAssignedAssociates([detail]);
        return withAssociates;
    }
    async updateCustomer(customerId, dto, actor) {
        this.assertAdminOrAssociate(actor);
        await this.assertCanAccessCustomer(actor, customerId);
        const customer = await this.customerRepository.findOne({ where: { id: customerId } });
        if (!customer) {
            throw new common_1.NotFoundException(`Customer #${customerId} not found`);
        }
        if (dto.email !== undefined) {
            const normalizedEmail = dto.email.trim().toLowerCase();
            const existing = await this.customerRepository.findOne({ where: { email: normalizedEmail } });
            if (existing && existing.id !== customerId) {
                throw new common_1.ConflictException('Email already in use');
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
    async removeCustomer(customerId, actor) {
        if (!actor || actor.role !== user_role_enum_1.UserRole.ADMIN) {
            throw new common_1.ForbiddenException('Only Admin can delete customers');
        }
        const customer = await this.customerRepository.findOne({ where: { id: customerId } });
        if (!customer) {
            throw new common_1.NotFoundException(`Customer #${customerId} not found`);
        }
        await this.customerRepository.delete(customerId);
    }
    async addApplication(customerId, dto, actor) {
        this.assertAdminOrAssociate(actor);
        await this.assertCanAccessCustomer(actor, customerId);
        if (!dto.applicationTypeId && !dto.applicationTypeCode) {
            throw new common_1.BadRequestException('Provide applicationTypeId or applicationTypeCode');
        }
        const appType = await this.resolveApplicationType({
            applicationTypeId: dto.applicationTypeId,
            applicationTypeCode: dto.applicationTypeCode,
        });
        const customer = await this.customerRepository.findOne({ where: { id: customerId } });
        if (!customer) {
            throw new common_1.NotFoundException(`Customer #${customerId} not found`);
        }
        const savedApp = await this.applicationRepository.save(this.applicationRepository.create({
            customerId,
            applicationTypeId: appType.id,
            status: dto.status ?? customer_application_status_enum_1.CustomerApplicationStatus.DRAFT,
            pipeline: dto.pipeline ?? null,
        }));
        await this.dataSource.transaction(async (em) => {
            await this.applicationWorkflowService.instantiateForNewApplication(em, savedApp.id, appType.id);
        });
        return this.findOneDetail(customerId, actor);
    }
    async updateApplication(customerId, applicationId, dto, actor) {
        this.assertAdminOrAssociate(actor);
        await this.assertCanAccessCustomer(actor, customerId);
        const app = await this.applicationRepository.findOne({
            where: { id: applicationId, customerId },
            relations: ['applicationType'],
        });
        if (!app) {
            throw new common_1.NotFoundException(`Application #${applicationId} not found for this customer`);
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
            await this.dataSource.manager.delete(customer_application_pipeline_progress_entity_1.CustomerApplicationPipelineProgress, {
                customerApplicationId: app.id,
            });
            await this.dataSource.manager.delete(customer_application_document_entity_1.CustomerApplicationDocument, {
                customerApplicationId: app.id,
            });
            await this.dataSource.transaction(async (em) => {
                await this.applicationWorkflowService.instantiateForNewApplication(em, app.id, app.applicationTypeId);
            });
        }
        return this.findOneDetail(customerId, actor);
    }
    async removeApplication(customerId, applicationId, actor) {
        if (!actor || actor.role !== user_role_enum_1.UserRole.ADMIN) {
            throw new common_1.ForbiddenException('Only Admin can delete customer applications');
        }
        const app = await this.applicationRepository.findOne({
            where: { id: applicationId, customerId },
        });
        if (!app) {
            throw new common_1.NotFoundException(`Application #${applicationId} not found for this customer`);
        }
        await this.applicationRepository.remove(app);
    }
    async queryCustomersWithFiltersForList(query, restrictToCustomerIds) {
        let candidateIds = restrictToCustomerIds;
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
    intersectIdSets(base, matched) {
        if (!matched.length) {
            return [];
        }
        if (base === undefined) {
            return matched;
        }
        const set = new Set(matched);
        return base.filter((id) => set.has(id));
    }
    async customerIdsForAssociateUser(associateUserId) {
        const associateProfile = await this.associateProfileRepository.findOne({
            where: { userId: associateUserId },
        });
        if (!associateProfile) {
            return [];
        }
        return this.pipelineStepAssignmentService.getCustomerIdsForAssociate(associateProfile.id);
    }
    async assertCanAccessCustomer(actor, customerId) {
        if (actor.role === user_role_enum_1.UserRole.ADMIN) {
            return;
        }
        if (actor.role !== user_role_enum_1.UserRole.ASSOCIATE) {
            throw new common_1.ForbiddenException('Insufficient permissions');
        }
        const associateProfile = await this.associateProfileRepository.findOne({
            where: { userId: actor.id },
        });
        if (!associateProfile) {
            throw new common_1.ForbiddenException('You do not have access to this customer');
        }
        const allowed = await this.pipelineStepAssignmentService.hasAccessToCustomer(associateProfile.id, customerId);
        if (!allowed) {
            throw new common_1.ForbiddenException('You do not have access to this customer');
        }
    }
    assertAdminOrAssociate(createdBy) {
        if (createdBy &&
            createdBy.role !== user_role_enum_1.UserRole.ADMIN &&
            createdBy.role !== user_role_enum_1.UserRole.ASSOCIATE) {
            throw new common_1.ForbiddenException('Only Admin or Associate can manage customers');
        }
    }
    async assertEmailAvailable(normalizedEmail) {
        const existing = await this.customerRepository.findOne({ where: { email: normalizedEmail } });
        if (existing) {
            throw new common_1.ConflictException('Email already in use');
        }
    }
    async assertCustomerEmailAvailableForInvite(normalizedEmail) {
        const [existingCustomer, existingUser, existingInvite] = await Promise.all([
            this.customerRepository.findOne({ where: { email: normalizedEmail } }),
            this.userRepository.findOne({ where: { email: normalizedEmail } }),
            this.customerInviteRepository.findOne({
                where: {
                    email: normalizedEmail,
                    acceptedAt: (0, typeorm_2.IsNull)(),
                    expiresAt: (0, typeorm_2.MoreThan)(new Date()),
                },
            }),
        ]);
        if (!existingCustomer) {
            throw new common_1.NotFoundException('Customer does not exist. Create customer first before inviting.');
        }
        if (existingCustomer.userId || existingUser) {
            throw new common_1.ConflictException('Email already in use');
        }
        if (existingInvite) {
            throw new common_1.ConflictException('An active invite already exists for this email');
        }
    }
    hashToken(token) {
        return (0, crypto_1.createHash)('sha256').update(token).digest('hex');
    }
    getCustomerInviteExpiryDate() {
        const hoursRaw = this.configService.get('CUSTOMER_INVITE_EXPIRES_HOURS', '48');
        const hours = Number(hoursRaw);
        const safeHours = Number.isFinite(hours) && hours > 0 ? hours : 48;
        return new Date(Date.now() + safeHours * 60 * 60 * 1000);
    }
    async resolveAssociateAssignmentOnCreate(dto, actor) {
        const requestedAssociateId = dto.associateId?.trim();
        if (actor.role === user_role_enum_1.UserRole.ADMIN) {
            if (!requestedAssociateId) {
                return undefined;
            }
            const associate = await this.associateProfileRepository.findOne({
                where: { id: requestedAssociateId },
            });
            if (!associate) {
                throw new common_1.NotFoundException(`Associate #${requestedAssociateId} not found`);
            }
            return associate.id;
        }
        if (actor.role !== user_role_enum_1.UserRole.ASSOCIATE) {
            return undefined;
        }
        const ownAssociateProfile = await this.associateProfileRepository.findOne({
            where: { userId: actor.id },
        });
        if (!ownAssociateProfile) {
            throw new common_1.ForbiddenException('Associate profile not found for current user');
        }
        if (requestedAssociateId && requestedAssociateId !== ownAssociateProfile.id) {
            throw new common_1.ForbiddenException('Associates can only assign created customers to themselves');
        }
        return ownAssociateProfile.id;
    }
    async attachAssignedAssociates(customers) {
        if (!customers.length) {
            return customers;
        }
        try {
            const enriched = await Promise.all(customers.map(async (customer) => {
                const assigneesByApp = await this.pipelineStepAssignmentService.getAssigneesForCustomerApplications(customer.id);
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
            }));
            return enriched;
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            this.logger.warn(`Could not load pipeline step assignments: ${message}`);
            return customers.map((customer) => ({ ...customer, assignedTo: [] }));
        }
    }
    uniqueAssignees(assignees) {
        const seen = new Set();
        const result = [];
        for (const assignee of assignees) {
            if (seen.has(assignee.id)) {
                continue;
            }
            seen.add(assignee.id);
            result.push(assignee);
        }
        return result;
    }
    async resolveApplicationType(input) {
        if (input.applicationTypeId?.trim()) {
            return this.applicationTypesService.findActiveById(input.applicationTypeId.trim());
        }
        const code = input.applicationTypeCode?.trim();
        if (code) {
            const row = await this.applicationTypesService.findActiveByCode(code);
            if (!row) {
                throw new common_1.BadRequestException(`Unknown or inactive application type code: ${code}`);
            }
            return row;
        }
        throw new common_1.BadRequestException('Provide applicationTypeId or applicationTypeCode');
    }
    async resolveApplicationTypeForLegacy(dto) {
        if (dto.applicationTypeId?.trim()) {
            return this.applicationTypesService.findActiveById(dto.applicationTypeId.trim());
        }
        if (dto.applicationTypeCode?.trim()) {
            const row = await this.applicationTypesService.findActiveByCode(dto.applicationTypeCode.trim());
            if (!row) {
                throw new common_1.BadRequestException(`Unknown or inactive application type code: ${dto.applicationTypeCode}`);
            }
            return row;
        }
        if (!dto.applicationType?.trim()) {
            throw new common_1.BadRequestException('Provide applicationType, applicationTypeId, or applicationTypeCode (see GET /application-types).');
        }
        return this.resolveTypeFromLegacyLabel(dto.applicationType);
    }
    async resolveTypeFromLegacyLabel(label) {
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
        throw new common_1.BadRequestException(`Unknown application type "${trimmed}". Use GET /application-types and send applicationTypeId or applicationTypeCode.`);
    }
    splitName(name) {
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
    toCustomerSummary(customer, includeDocuments = false) {
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
                assignedTo: [],
            })),
            assignedTo: [],
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
};
exports.CustomersService = CustomersService;
exports.CustomersService = CustomersService = CustomersService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(customer_profile_entity_1.CustomerProfile)),
    __param(1, (0, typeorm_1.InjectRepository)(customer_application_entity_1.CustomerApplication)),
    __param(2, (0, typeorm_1.InjectRepository)(associate_profile_entity_1.AssociateProfile)),
    __param(4, (0, typeorm_1.InjectRepository)(customer_invite_entity_1.CustomerInvite)),
    __param(5, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        pipeline_step_assignment_service_1.PipelineStepAssignmentService,
        typeorm_2.Repository,
        typeorm_2.Repository,
        application_types_service_1.ApplicationTypesService,
        application_workflow_service_1.ApplicationWorkflowService,
        customer_application_workflow_service_1.CustomerApplicationWorkflowService,
        customer_invite_mail_service_1.CustomerInviteMailService,
        config_1.ConfigService,
        typeorm_2.DataSource])
], CustomersService);
//# sourceMappingURL=customers.service.js.map