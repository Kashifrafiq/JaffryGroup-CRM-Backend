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
exports.CustomerApplicationWorkflowService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const customer_application_entity_1 = require("./entities/customer-application.entity");
const associate_customer_entity_1 = require("../users/entities/associate-customer.entity");
const associate_profile_entity_1 = require("../users/entities/associate-profile.entity");
const customer_profile_entity_1 = require("../users/entities/customer-profile.entity");
const user_role_enum_1 = require("../users/entities/user-role.enum");
const customer_application_pipeline_progress_entity_1 = require("../applications/entities/customer-application-pipeline-progress.entity");
const customer_application_document_entity_1 = require("../applications/entities/customer-application-document.entity");
const customer_application_document_status_enum_1 = require("../applications/entities/customer-application-document-status.enum");
const s3_storage_service_1 = require("../applications/s3-storage.service");
let CustomerApplicationWorkflowService = class CustomerApplicationWorkflowService {
    applicationRepository;
    pipelineProgressRepository;
    applicationDocumentRepository;
    associateCustomerRepository;
    associateProfileRepository;
    customerProfileRepository;
    s3StorageService;
    constructor(applicationRepository, pipelineProgressRepository, applicationDocumentRepository, associateCustomerRepository, associateProfileRepository, customerProfileRepository, s3StorageService) {
        this.applicationRepository = applicationRepository;
        this.pipelineProgressRepository = pipelineProgressRepository;
        this.applicationDocumentRepository = applicationDocumentRepository;
        this.associateCustomerRepository = associateCustomerRepository;
        this.associateProfileRepository = associateProfileRepository;
        this.customerProfileRepository = customerProfileRepository;
        this.s3StorageService = s3StorageService;
    }
    tid(id) {
        return id.trim();
    }
    async getWorkflow(customerId, applicationId, actor) {
        const cid = this.tid(customerId);
        const aid = this.tid(applicationId);
        await this.assertCanAccess(actor, cid);
        const app = await this.loadApplication(cid, aid, [
            'pipelineProgress',
            'applicationDocuments',
            'applicationDocuments.requirement',
            'applicationType',
        ]);
        return this.buildWorkflowPayload(app);
    }
    async patchPipelineStep(customerId, applicationId, stepIndex, completed, actor) {
        const cid = this.tid(customerId);
        const aid = this.tid(applicationId);
        await this.assertCanAccess(actor, cid);
        const app = await this.loadApplication(cid, aid, []);
        const row = await this.pipelineProgressRepository.findOne({
            where: { customerApplicationId: app.id, stepIndex },
        });
        if (!row) {
            throw new common_1.NotFoundException(`Pipeline step ${stepIndex} not found for this application`);
        }
        row.completedAt = completed ? new Date() : null;
        await this.pipelineProgressRepository.save(row);
        return this.buildWorkflowPayload(await this.loadApplication(cid, aid, [
            'pipelineProgress',
            'applicationDocuments',
            'applicationDocuments.requirement',
            'applicationType',
        ]));
    }
    async presignDocumentUpload(customerId, applicationId, documentId, dto, actor) {
        const cid = this.tid(customerId);
        const aid = this.tid(applicationId);
        const did = this.tid(documentId);
        await this.assertCanAccess(actor, cid);
        const doc = await this.loadDocumentRow(cid, aid, did, ['requirement']);
        if (doc.status === customer_application_document_status_enum_1.CustomerApplicationDocumentStatus.WAIVED) {
            throw new common_1.BadRequestException('Document was waived; re-open before upload.');
        }
        const customer = await this.customerProfileRepository.findOne({ where: { id: cid } });
        if (!customer) {
            throw new common_1.NotFoundException(`Customer #${cid} not found`);
        }
        const key = this.s3StorageService.buildDocumentObjectKey({
            customerId: cid,
            firstName: customer.firstName,
            lastName: customer.lastName,
            documentId: doc.id,
            originalFilename: dto.filename,
        });
        const signed = await this.s3StorageService.createPresignedPutUrl(key, dto.contentType);
        doc.storageKey = key;
        doc.bucket = signed.bucket;
        doc.mimeType = dto.contentType;
        doc.originalFilename = dto.filename;
        await this.applicationDocumentRepository.save(doc);
        return {
            uploadUrl: signed.uploadUrl,
            bucket: signed.bucket,
            key: signed.key,
            expiresIn: signed.expiresIn,
        };
    }
    async completeDocumentUpload(customerId, applicationId, documentId, dto, actor) {
        const cid = this.tid(customerId);
        const aid = this.tid(applicationId);
        const did = this.tid(documentId);
        await this.assertCanAccess(actor, cid);
        const doc = await this.loadDocumentRow(cid, aid, did, ['requirement']);
        const customer = await this.customerProfileRepository.findOne({ where: { id: cid } });
        if (!customer) {
            throw new common_1.NotFoundException(`Customer #${cid} not found`);
        }
        const expectedPrefix = this.s3StorageService.buildCustomerDocumentsFolder(customer.id, customer.firstName, customer.lastName) + '/';
        if (!dto.storageKey.startsWith(expectedPrefix)) {
            throw new common_1.BadRequestException('storageKey does not match this customer');
        }
        if (doc.storageKey && doc.storageKey !== dto.storageKey) {
            throw new common_1.BadRequestException('storageKey does not match presigned key for this document');
        }
        doc.storageKey = dto.storageKey;
        doc.originalFilename = dto.originalFilename;
        doc.mimeType = dto.mimeType;
        doc.sizeBytes = dto.sizeBytes;
        doc.status = customer_application_document_status_enum_1.CustomerApplicationDocumentStatus.UPLOADED;
        doc.uploadedAt = new Date();
        doc.uploadedByUserId = actor.id;
        await this.applicationDocumentRepository.save(doc);
        return this.getWorkflow(cid, aid, actor);
    }
    async patchDocument(customerId, applicationId, documentId, dto, actor) {
        const cid = this.tid(customerId);
        const aid = this.tid(applicationId);
        const did = this.tid(documentId);
        await this.assertCanAccess(actor, cid);
        const doc = await this.loadDocumentRow(cid, aid, did, []);
        if (dto.status === customer_application_document_status_enum_1.CustomerApplicationDocumentStatus.UPLOADED) {
            throw new common_1.BadRequestException('Use presign + complete flow to mark uploaded');
        }
        if (dto.status !== undefined) {
            doc.status = dto.status;
        }
        if (dto.notes !== undefined) {
            doc.notes = dto.notes;
        }
        await this.applicationDocumentRepository.save(doc);
        return this.getWorkflow(cid, aid, actor);
    }
    buildWorkflowPayload(app) {
        const steps = (app.pipelineProgress ?? [])
            .slice()
            .sort((a, b) => a.stepIndex - b.stepIndex)
            .map((p) => ({
            stepIndex: p.stepIndex,
            title: p.title,
            completedAt: p.completedAt ?? null,
        }));
        const documents = (app.applicationDocuments ?? [])
            .slice()
            .sort((a, b) => a.requirement.sortOrder - b.requirement.sortOrder)
            .map((d) => ({
            id: d.id,
            status: d.status,
            requirementKey: d.requirement.requirementKey,
            sectionTitle: d.requirement.sectionTitle,
            itemLabel: d.requirement.itemLabel,
            sortOrder: d.requirement.sortOrder,
            storageKey: d.storageKey ?? null,
            bucket: d.bucket ?? null,
            originalFilename: d.originalFilename ?? null,
            mimeType: d.mimeType ?? null,
            sizeBytes: d.sizeBytes ?? null,
            uploadedAt: d.uploadedAt ?? null,
            uploadedByUserId: d.uploadedByUserId ?? null,
            notes: d.notes ?? null,
        }));
        return {
            applicationId: app.id,
            applicationType: {
                id: app.applicationType.id,
                code: app.applicationType.code,
                name: app.applicationType.name,
            },
            pipelineSteps: steps,
            documents,
        };
    }
    async loadApplication(customerId, applicationId, relations) {
        const app = await this.applicationRepository.findOne({
            where: { id: applicationId, customerId },
            relations: ['applicationType', ...relations],
        });
        if (!app) {
            throw new common_1.NotFoundException(`Application #${applicationId} not found for this customer`);
        }
        return app;
    }
    async loadDocumentRow(customerId, applicationId, documentId, relations) {
        const app = await this.applicationRepository.findOne({
            where: { id: applicationId, customerId },
        });
        if (!app) {
            throw new common_1.NotFoundException(`Application #${applicationId} not found for this customer`);
        }
        const doc = await this.applicationDocumentRepository.findOne({
            where: { id: documentId, customerApplicationId: applicationId },
            relations: ['requirement', ...relations],
        });
        if (!doc) {
            throw new common_1.NotFoundException(`Document #${documentId} not found for this application`);
        }
        return doc;
    }
    async assertCanAccess(actor, customerId) {
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
        const link = await this.associateCustomerRepository.findOne({
            where: { associateId: associateProfile.id, customerId },
        });
        if (!link) {
            throw new common_1.ForbiddenException('You do not have access to this customer');
        }
    }
};
exports.CustomerApplicationWorkflowService = CustomerApplicationWorkflowService;
exports.CustomerApplicationWorkflowService = CustomerApplicationWorkflowService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(customer_application_entity_1.CustomerApplication)),
    __param(1, (0, typeorm_1.InjectRepository)(customer_application_pipeline_progress_entity_1.CustomerApplicationPipelineProgress)),
    __param(2, (0, typeorm_1.InjectRepository)(customer_application_document_entity_1.CustomerApplicationDocument)),
    __param(3, (0, typeorm_1.InjectRepository)(associate_customer_entity_1.AssociateCustomer)),
    __param(4, (0, typeorm_1.InjectRepository)(associate_profile_entity_1.AssociateProfile)),
    __param(5, (0, typeorm_1.InjectRepository)(customer_profile_entity_1.CustomerProfile)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        s3_storage_service_1.S3StorageService])
], CustomerApplicationWorkflowService);
//# sourceMappingURL=customer-application-workflow.service.js.map