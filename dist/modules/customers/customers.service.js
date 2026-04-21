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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const customer_profile_entity_1 = require("../users/entities/customer-profile.entity");
const user_role_enum_1 = require("../users/entities/user-role.enum");
const associate_customer_entity_1 = require("../users/entities/associate-customer.entity");
const associate_profile_entity_1 = require("../users/entities/associate-profile.entity");
const customer_application_entity_1 = require("./entities/customer-application.entity");
const customer_application_status_enum_1 = require("./entities/customer-application-status.enum");
const application_types_service_1 = require("../applications/application-types.service");
const application_workflow_service_1 = require("../applications/application-workflow.service");
const customer_application_pipeline_progress_entity_1 = require("../applications/entities/customer-application-pipeline-progress.entity");
const customer_application_document_entity_1 = require("../applications/entities/customer-application-document.entity");
const customer_application_workflow_service_1 = require("./customer-application-workflow.service");
let CustomersService = class CustomersService {
    customerRepository;
    applicationRepository;
    associateCustomerRepository;
    associateProfileRepository;
    applicationTypesService;
    applicationWorkflowService;
    customerApplicationWorkflowService;
    dataSource;
    constructor(customerRepository, applicationRepository, associateCustomerRepository, associateProfileRepository, applicationTypesService, applicationWorkflowService, customerApplicationWorkflowService, dataSource) {
        this.customerRepository = customerRepository;
        this.applicationRepository = applicationRepository;
        this.associateCustomerRepository = associateCustomerRepository;
        this.associateProfileRepository = associateProfileRepository;
        this.applicationTypesService = applicationTypesService;
        this.applicationWorkflowService = applicationWorkflowService;
        this.customerApplicationWorkflowService = customerApplicationWorkflowService;
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
        return this.findOneDetail(customer.id, createdBy);
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
            const customers = await this.queryCustomersWithFilters(query, undefined);
            return Promise.all(customers.map((c) => this.toCustomerDetail(c)));
        }
        const ids = await this.customerIdsForAssociateUser(actor.id);
        if (!ids.length) {
            return [];
        }
        const customers = await this.queryCustomersWithFilters(query, ids);
        return Promise.all(customers.map((c) => this.toCustomerDetail(c)));
    }
    async findOneDetail(customerId, actor) {
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
            throw new common_1.NotFoundException(`Customer #${customerId} not found`);
        }
        await this.assertCanAccessCustomer(actor, customerId);
        return this.toCustomerDetail(customer);
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
    async queryCustomersWithFilters(query, restrictToCustomerIds) {
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
        const links = await this.associateCustomerRepository.find({
            where: { associateId: associateProfile.id },
        });
        return links.map((l) => l.customerId);
    }
    async assertCanAccessCustomer(actor, customerId) {
        if (actor.role === user_role_enum_1.UserRole.ADMIN) {
            return;
        }
        if (actor.role !== user_role_enum_1.UserRole.ASSOCIATE) {
            throw new common_1.ForbiddenException('Insufficient permissions');
        }
        const ids = await this.customerIdsForAssociateUser(actor.id);
        if (!ids.includes(customerId)) {
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
    toCustomerDetail(customer) {
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
};
exports.CustomersService = CustomersService;
exports.CustomersService = CustomersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(customer_profile_entity_1.CustomerProfile)),
    __param(1, (0, typeorm_1.InjectRepository)(customer_application_entity_1.CustomerApplication)),
    __param(2, (0, typeorm_1.InjectRepository)(associate_customer_entity_1.AssociateCustomer)),
    __param(3, (0, typeorm_1.InjectRepository)(associate_profile_entity_1.AssociateProfile)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        application_types_service_1.ApplicationTypesService,
        application_workflow_service_1.ApplicationWorkflowService,
        customer_application_workflow_service_1.CustomerApplicationWorkflowService,
        typeorm_2.DataSource])
], CustomersService);
//# sourceMappingURL=customers.service.js.map