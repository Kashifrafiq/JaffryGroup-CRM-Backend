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
const user_entity_1 = require("../users/entities/user.entity");
const customer_document_visibility_1 = require("./customer-document-visibility");
const customer_application_entity_1 = require("./entities/customer-application.entity");
const associate_profile_entity_1 = require("../users/entities/associate-profile.entity");
const pipeline_step_assignment_service_1 = require("./pipeline-step-assignment.service");
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
    associateProfileRepository;
    pipelineStepAssignmentService;
    customerProfileRepository;
    userRepository;
    s3StorageService;
    constructor(applicationRepository, pipelineProgressRepository, applicationDocumentRepository, associateProfileRepository, pipelineStepAssignmentService, customerProfileRepository, userRepository, s3StorageService) {
        this.applicationRepository = applicationRepository;
        this.pipelineProgressRepository = pipelineProgressRepository;
        this.applicationDocumentRepository = applicationDocumentRepository;
        this.associateProfileRepository = associateProfileRepository;
        this.pipelineStepAssignmentService = pipelineStepAssignmentService;
        this.customerProfileRepository = customerProfileRepository;
        this.userRepository = userRepository;
        this.s3StorageService = s3StorageService;
    }
    tid(id) {
        return id.trim();
    }
    async getWorkflow(customerId, applicationId, actor) {
        const cid = this.tid(customerId);
        const aid = this.tid(applicationId);
        await this.assertCanAccessApplication(actor, cid, aid);
        const app = await this.loadApplication(cid, aid, [
            'pipelineProgress',
            'applicationDocuments',
            'applicationDocuments.requirement',
            'applicationType',
        ]);
        return this.buildWorkflowPayload(app);
    }
    async assignPipelineStepAssociates(customerId, applicationId, stepIndex, associateIds) {
        const progress = await this.pipelineStepAssignmentService.resolvePipelineProgress(this.tid(customerId), this.tid(applicationId), stepIndex);
        return this.pipelineStepAssignmentService.assignAssociatesToStep(progress.id, associateIds);
    }
    async replacePipelineStepAssociates(customerId, applicationId, stepIndex, associateIds) {
        const progress = await this.pipelineStepAssignmentService.resolvePipelineProgress(this.tid(customerId), this.tid(applicationId), stepIndex);
        return this.pipelineStepAssignmentService.replaceAssociatesOnStep(progress.id, associateIds);
    }
    async unassignPipelineStepAssociate(customerId, applicationId, stepIndex, associateId) {
        const progress = await this.pipelineStepAssignmentService.resolvePipelineProgress(this.tid(customerId), this.tid(applicationId), stepIndex);
        return this.pipelineStepAssignmentService.unassignAssociateFromStep(progress.id, associateId);
    }
    async patchPipelineStep(customerId, applicationId, stepIndex, completed, actor) {
        const cid = this.tid(customerId);
        const aid = this.tid(applicationId);
        await this.assertCanAccessApplication(actor, cid, aid);
        await this.assertCanModifyPipelineStep(actor, aid, stepIndex);
        const app = await this.loadApplication(cid, aid, []);
        const row = await this.pipelineProgressRepository.findOne({
            where: { customerApplicationId: app.id, stepIndex },
        });
        if (!row) {
            throw new common_1.NotFoundException(`Pipeline step ${stepIndex} not found for this application`);
        }
        row.completedAt = completed ? new Date() : null;
        await this.pipelineProgressRepository.save(row);
        return await this.buildWorkflowPayload(await this.loadApplication(cid, aid, [
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
        await this.assertCanAccessApplication(actor, cid, aid);
        const doc = await this.loadDocumentRow(cid, aid, did, ['requirement']);
        if (actor.role === user_role_enum_1.UserRole.CUSTOMER) {
            await this.assertCustomerCanUploadDocument(doc, actor.id);
        }
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
        if (actor.role !== user_role_enum_1.UserRole.CUSTOMER) {
            doc.uploadedAt = null;
            doc.uploadedByUserId = null;
            doc.sizeBytes = null;
            doc.status = customer_application_document_status_enum_1.CustomerApplicationDocumentStatus.PENDING;
        }
        await this.applicationDocumentRepository.save(doc);
        return {
            uploadUrl: signed.uploadUrl,
            bucket: signed.bucket,
            key: signed.key,
            expiresIn: signed.expiresIn,
        };
    }
    async presignDocumentUploadForCustomerUser(applicationId, documentId, dto, actor) {
        if (actor.role !== user_role_enum_1.UserRole.CUSTOMER) {
            throw new common_1.ForbiddenException('Only customer can use this endpoint');
        }
        const customerId = await this.customerIdForUser(actor.id);
        return this.presignDocumentUpload(customerId, applicationId, documentId, dto, actor);
    }
    async completeDocumentUpload(customerId, applicationId, documentId, dto, actor) {
        const cid = this.tid(customerId);
        const aid = this.tid(applicationId);
        const did = this.tid(documentId);
        await this.assertCanAccessApplication(actor, cid, aid);
        const doc = await this.loadDocumentRow(cid, aid, did, ['requirement']);
        if (actor.role === user_role_enum_1.UserRole.CUSTOMER) {
            await this.assertCustomerCanUploadDocument(doc, actor.id);
        }
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
        if (actor.role === user_role_enum_1.UserRole.CUSTOMER) {
            return this.getCustomerWorkflow(cid, aid, actor);
        }
        return this.getWorkflow(cid, aid, actor);
    }
    async completeDocumentUploadForCustomerUser(applicationId, documentId, dto, actor) {
        if (actor.role !== user_role_enum_1.UserRole.CUSTOMER) {
            throw new common_1.ForbiddenException('Only customer can use this endpoint');
        }
        const customerId = await this.customerIdForUser(actor.id);
        return this.completeDocumentUpload(customerId, applicationId, documentId, dto, actor);
    }
    async patchDocument(customerId, applicationId, documentId, dto, actor) {
        const cid = this.tid(customerId);
        const aid = this.tid(applicationId);
        const did = this.tid(documentId);
        await this.assertCanAccessApplication(actor, cid, aid);
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
    async getDocumentReadUrl(customerId, applicationId, documentId, actor) {
        const cid = this.tid(customerId);
        const aid = this.tid(applicationId);
        const did = this.tid(documentId);
        await this.assertCanAccessApplication(actor, cid, aid);
        const doc = await this.loadDocumentRow(cid, aid, did, []);
        if (!doc.storageKey) {
            throw new common_1.BadRequestException('Document file is not uploaded yet');
        }
        return this.s3StorageService.createPresignedGetUrl(doc.storageKey);
    }
    async getDocumentReadUrlForCustomerUser(applicationId, documentId, actor) {
        if (actor.role !== user_role_enum_1.UserRole.CUSTOMER) {
            throw new common_1.ForbiddenException('Only customer can use this endpoint');
        }
        const customerId = await this.customerIdForUser(actor.id);
        const cid = this.tid(customerId);
        const aid = this.tid(applicationId);
        const did = this.tid(documentId);
        await this.assertCanAccessApplication(actor, cid, aid);
        const doc = await this.loadDocumentRow(cid, aid, did, []);
        await this.assertCustomerCanPreviewDocument(doc, actor.id);
        if (!doc.storageKey) {
            throw new common_1.BadRequestException('Document file is not uploaded yet');
        }
        return this.s3StorageService.createPresignedGetUrl(doc.storageKey);
    }
    async getCustomerWorkflow(customerId, applicationId, actor) {
        const cid = this.tid(customerId);
        const aid = this.tid(applicationId);
        if (actor.role !== user_role_enum_1.UserRole.CUSTOMER) {
            throw new common_1.ForbiddenException('Only customer can use this workflow view');
        }
        await this.assertCanAccessApplication(actor, cid, aid);
        const app = await this.loadApplication(cid, aid, [
            'pipelineProgress',
            'applicationDocuments',
            'applicationDocuments.requirement',
            'applicationType',
        ]);
        const uploaderRoleByUserId = await this.uploaderRoleMapForDocuments(app.applicationDocuments ?? []);
        return this.buildWorkflowPayload(app, actor.id, uploaderRoleByUserId);
    }
    async buildWorkflowPayload(app, customerUserId, uploaderRoleByUserId = new Map()) {
        const progressRows = (app.pipelineProgress ?? []).slice().sort((a, b) => a.stepIndex - b.stepIndex);
        const assigneesByProgressId = await this.pipelineStepAssignmentService.getAssigneesByProgressIds(progressRows.map((p) => p.id));
        const steps = progressRows.map((p) => ({
            stepIndex: p.stepIndex,
            title: p.title,
            completedAt: p.completedAt ?? null,
            assignedTo: assigneesByProgressId.get(p.id) ?? [],
        }));
        const documents = (app.applicationDocuments ?? [])
            .slice()
            .sort((a, b) => a.requirement.sortOrder - b.requirement.sortOrder)
            .map((d) => {
            const uploadedByCustomer = customerUserId
                ? (0, customer_document_visibility_1.isUploadedByCustomerUser)(d, customerUserId, uploaderRoleByUserId)
                : undefined;
            const row = {
                id: d.id,
                status: d.status,
                requirementKey: d.requirement.requirementKey,
                sectionTitle: d.requirement.sectionTitle,
                itemLabel: d.requirement.itemLabel,
                sortOrder: d.requirement.sortOrder,
                originalFilename: d.originalFilename ?? null,
                mimeType: d.mimeType ?? null,
                sizeBytes: d.sizeBytes ?? null,
                uploadedAt: d.uploadedAt ?? null,
                canPreview: customerUserId
                    ? (0, customer_document_visibility_1.canCustomerPreviewDocument)(d, customerUserId, uploaderRoleByUserId)
                    : true,
            };
            if (!customerUserId) {
                row.storageKey = d.storageKey ?? null;
                row.bucket = d.bucket ?? null;
                row.uploadedByUserId = d.uploadedByUserId ?? null;
                row.notes = d.notes ?? null;
            }
            if (uploadedByCustomer !== undefined) {
                row.uploadedByMe = uploadedByCustomer;
            }
            return row;
        });
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
            if (actor.role !== user_role_enum_1.UserRole.CUSTOMER) {
                throw new common_1.ForbiddenException('Insufficient permissions');
            }
            const customer = await this.customerProfileRepository.findOne({
                where: { id: customerId, userId: actor.id },
                select: ['id'],
            });
            if (!customer) {
                throw new common_1.ForbiddenException('You do not have access to this customer');
            }
            return;
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
    async assertCanAccessApplication(actor, customerId, applicationId) {
        await this.assertCanAccess(actor, customerId);
        if (actor.role !== user_role_enum_1.UserRole.ASSOCIATE) {
            return;
        }
        const associateProfile = await this.associateProfileRepository.findOne({
            where: { userId: actor.id },
        });
        if (!associateProfile) {
            throw new common_1.ForbiddenException('You do not have access to this application');
        }
        const allowed = await this.pipelineStepAssignmentService.hasAccessToApplication(associateProfile.id, applicationId);
        if (!allowed) {
            throw new common_1.ForbiddenException('You do not have access to this application');
        }
    }
    async assertCanModifyPipelineStep(actor, applicationId, stepIndex) {
        if (actor.role !== user_role_enum_1.UserRole.ASSOCIATE) {
            return;
        }
        const associateProfile = await this.associateProfileRepository.findOne({
            where: { userId: actor.id },
        });
        if (!associateProfile) {
            throw new common_1.ForbiddenException('You do not have access to this pipeline step');
        }
        const allowed = await this.pipelineStepAssignmentService.hasAccessToStep(associateProfile.id, applicationId, stepIndex);
        if (!allowed) {
            throw new common_1.ForbiddenException('You are not assigned to this pipeline step');
        }
    }
    async uploaderRoleMapForDocuments(documents) {
        const uploaderIds = [
            ...new Set(documents
                .map((d) => d.uploadedByUserId?.trim())
                .filter((id) => !!id)),
        ];
        if (!uploaderIds.length) {
            return new Map();
        }
        const users = await this.userRepository.find({
            where: { id: (0, typeorm_2.In)(uploaderIds) },
            select: ['id', 'role'],
        });
        return new Map(users.map((u) => [u.id, u.role]));
    }
    async assertCustomerCanUploadDocument(doc, customerUserId) {
        if (!doc.uploadedAt) {
            return;
        }
        const roleMap = await this.uploaderRoleMapForDocuments([doc]);
        if (!(0, customer_document_visibility_1.isUploadedByCustomerUser)(doc, customerUserId, roleMap)) {
            throw new common_1.ForbiddenException('This document was uploaded by your team. You cannot replace or view it here.');
        }
    }
    async assertCustomerCanPreviewDocument(doc, customerUserId) {
        const roleMap = await this.uploaderRoleMapForDocuments([doc]);
        if (!(0, customer_document_visibility_1.canCustomerPreviewDocument)(doc, customerUserId, roleMap)) {
            throw new common_1.ForbiddenException('You can only preview documents you uploaded');
        }
    }
    async customerIdForUser(userId) {
        const customer = await this.customerProfileRepository.findOne({
            where: { userId },
            select: ['id'],
        });
        if (!customer) {
            throw new common_1.ForbiddenException('Customer profile not found for current user');
        }
        return customer.id;
    }
};
exports.CustomerApplicationWorkflowService = CustomerApplicationWorkflowService;
exports.CustomerApplicationWorkflowService = CustomerApplicationWorkflowService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(customer_application_entity_1.CustomerApplication)),
    __param(1, (0, typeorm_1.InjectRepository)(customer_application_pipeline_progress_entity_1.CustomerApplicationPipelineProgress)),
    __param(2, (0, typeorm_1.InjectRepository)(customer_application_document_entity_1.CustomerApplicationDocument)),
    __param(3, (0, typeorm_1.InjectRepository)(associate_profile_entity_1.AssociateProfile)),
    __param(5, (0, typeorm_1.InjectRepository)(customer_profile_entity_1.CustomerProfile)),
    __param(6, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        pipeline_step_assignment_service_1.PipelineStepAssignmentService,
        typeorm_2.Repository,
        typeorm_2.Repository,
        s3_storage_service_1.S3StorageService])
], CustomerApplicationWorkflowService);
//# sourceMappingURL=customer-application-workflow.service.js.map