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
const customer_document_display_1 = require("./customer-document-display");
const customer_pipeline_display_1 = require("./customer-pipeline-display");
const customer_application_entity_1 = require("./entities/customer-application.entity");
const associate_profile_entity_1 = require("../users/entities/associate-profile.entity");
const pipeline_step_assignment_service_1 = require("./pipeline-step-assignment.service");
const document_assignment_service_1 = require("./document-assignment.service");
const customer_profile_entity_1 = require("../users/entities/customer-profile.entity");
const user_role_enum_1 = require("../users/entities/user-role.enum");
const customer_application_pipeline_progress_entity_1 = require("../applications/entities/customer-application-pipeline-progress.entity");
const customer_application_document_entity_1 = require("../applications/entities/customer-application-document.entity");
const customer_application_document_file_entity_1 = require("../applications/entities/customer-application-document-file.entity");
const customer_application_document_status_enum_1 = require("../applications/entities/customer-application-document-status.enum");
const s3_storage_service_1 = require("../applications/s3-storage.service");
let CustomerApplicationWorkflowService = class CustomerApplicationWorkflowService {
    applicationRepository;
    pipelineProgressRepository;
    applicationDocumentRepository;
    applicationDocumentFileRepository;
    associateProfileRepository;
    pipelineStepAssignmentService;
    documentAssignmentService;
    customerProfileRepository;
    userRepository;
    s3StorageService;
    constructor(applicationRepository, pipelineProgressRepository, applicationDocumentRepository, applicationDocumentFileRepository, associateProfileRepository, pipelineStepAssignmentService, documentAssignmentService, customerProfileRepository, userRepository, s3StorageService) {
        this.applicationRepository = applicationRepository;
        this.pipelineProgressRepository = pipelineProgressRepository;
        this.applicationDocumentRepository = applicationDocumentRepository;
        this.applicationDocumentFileRepository = applicationDocumentFileRepository;
        this.associateProfileRepository = associateProfileRepository;
        this.pipelineStepAssignmentService = pipelineStepAssignmentService;
        this.documentAssignmentService = documentAssignmentService;
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
            'applicationDocuments.files',
            'applicationType',
        ]);
        const assignedDocumentIds = await this.assignedDocumentIdsForActor(actor, cid);
        const assignedPipelineProgressIds = await this.assignedPipelineProgressIdsForActor(actor, cid, aid);
        return this.buildWorkflowPayload(app, undefined, new Map(), {
            assignedDocumentIds,
            assignedPipelineProgressIds,
            includeDocumentAssignees: actor.role === user_role_enum_1.UserRole.ADMIN,
        });
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
        this.assertPipelineStepIsActive(row);
        row.completedAt = completed ? new Date() : null;
        await this.pipelineProgressRepository.save(row);
        return await this.buildWorkflowPayload(await this.loadApplication(cid, aid, [
            'pipelineProgress',
            'applicationDocuments',
            'applicationDocuments.files',
            'applicationType',
        ]));
    }
    async presignDocumentUpload(customerId, applicationId, documentId, dto, actor) {
        const cid = this.tid(customerId);
        const aid = this.tid(applicationId);
        const did = this.tid(documentId);
        await this.assertCanAccessApplication(actor, cid, aid);
        const app = await this.loadApplication(cid, aid, ['applicationType']);
        const doc = await this.loadDocumentRow(cid, aid, did, []);
        this.assertDocumentIsActive(doc);
        if (actor.role === user_role_enum_1.UserRole.CUSTOMER) {
            await this.assertCustomerCanUploadDocument(doc, actor.id);
        }
        else if (actor.role === user_role_enum_1.UserRole.ASSOCIATE) {
            await this.assertCanAccessDocument(actor, did);
        }
        if (doc.status === customer_application_document_status_enum_1.CustomerApplicationDocumentStatus.WAIVED) {
            throw new common_1.BadRequestException('Document was waived; re-open before upload.');
        }
        const customer = await this.customerProfileRepository.findOne({ where: { id: cid } });
        if (!customer) {
            throw new common_1.NotFoundException(`Customer #${cid} not found`);
        }
        const pendingFile = await this.applicationDocumentFileRepository.save(this.applicationDocumentFileRepository.create({
            customerApplicationDocumentId: doc.id,
            mimeType: dto.contentType,
            originalFilename: dto.filename,
        }));
        const key = this.s3StorageService.buildDocumentObjectKey({
            customerId: cid,
            firstName: customer.firstName,
            lastName: customer.lastName,
            applicationId: aid,
            applicationName: app.applicationType.name,
            documentName: doc.itemLabel,
            fileId: pendingFile.id,
            originalFilename: dto.filename,
        });
        const signed = await this.s3StorageService.createPresignedPutUrl(key, dto.contentType);
        pendingFile.storageKey = key;
        pendingFile.bucket = signed.bucket;
        await this.applicationDocumentFileRepository.save(pendingFile);
        return {
            uploadUrl: signed.uploadUrl,
            bucket: signed.bucket,
            key: signed.key,
            expiresIn: signed.expiresIn,
            fileId: pendingFile.id,
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
        const app = await this.loadApplication(cid, aid, ['applicationType']);
        const doc = await this.loadDocumentRow(cid, aid, did, ['files']);
        this.assertDocumentIsActive(doc);
        if (actor.role === user_role_enum_1.UserRole.CUSTOMER) {
            await this.assertCustomerCanUploadDocument(doc, actor.id);
        }
        else if (actor.role === user_role_enum_1.UserRole.ASSOCIATE) {
            await this.assertCanAccessDocument(actor, did);
        }
        const customer = await this.customerProfileRepository.findOne({ where: { id: cid } });
        if (!customer) {
            throw new common_1.NotFoundException(`Customer #${cid} not found`);
        }
        if (dto.fileId?.trim()) {
            const file = await this.loadDocumentFileRow(did, dto.fileId.trim());
            const expectedPrefix = this.s3StorageService.buildDocumentRequirementPrefix({
                customerId: cid,
                firstName: customer.firstName,
                lastName: customer.lastName,
                applicationId: aid,
                applicationName: app.applicationType.name,
                documentName: doc.itemLabel,
            });
            if (!dto.storageKey.startsWith(expectedPrefix)) {
                throw new common_1.BadRequestException('storageKey does not match this document requirement');
            }
            if (file.storageKey && file.storageKey !== dto.storageKey) {
                throw new common_1.BadRequestException('storageKey does not match presigned key for this file');
            }
            file.storageKey = dto.storageKey;
            file.originalFilename = dto.originalFilename;
            file.mimeType = dto.mimeType;
            file.sizeBytes = dto.sizeBytes;
            file.uploadedAt = new Date();
            file.uploadedByUserId = actor.id;
            await this.applicationDocumentFileRepository.save(file);
            doc.status = customer_application_document_status_enum_1.CustomerApplicationDocumentStatus.UPLOADED;
            await this.applicationDocumentRepository.save(doc);
        }
        else {
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
        }
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
        if (actor.role === user_role_enum_1.UserRole.ASSOCIATE) {
            await this.assertCanAccessDocument(actor, did);
        }
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
    async getDocumentReadUrl(customerId, applicationId, documentId, actor, fileId) {
        const cid = this.tid(customerId);
        const aid = this.tid(applicationId);
        const did = this.tid(documentId);
        await this.assertCanAccessApplication(actor, cid, aid);
        const doc = await this.loadDocumentRow(cid, aid, did, ['files']);
        if (actor.role === user_role_enum_1.UserRole.ASSOCIATE) {
            await this.assertCanAccessDocument(actor, did);
        }
        if (fileId?.trim()) {
            const file = await this.loadDocumentFileRow(did, fileId.trim());
            if (!file.storageKey) {
                throw new common_1.BadRequestException('Document file is not uploaded yet');
            }
            return this.s3StorageService.createPresignedGetUrl(file.storageKey);
        }
        if (!doc.storageKey) {
            throw new common_1.BadRequestException('Document file is not uploaded yet');
        }
        return this.s3StorageService.createPresignedGetUrl(doc.storageKey);
    }
    async getDocumentReadUrlForCustomerUser(applicationId, documentId, actor, fileId) {
        if (actor.role !== user_role_enum_1.UserRole.CUSTOMER) {
            throw new common_1.ForbiddenException('Only customer can use this endpoint');
        }
        const customerId = await this.customerIdForUser(actor.id);
        const cid = this.tid(customerId);
        const aid = this.tid(applicationId);
        const did = this.tid(documentId);
        await this.assertCanAccessApplication(actor, cid, aid);
        const doc = await this.loadDocumentRow(cid, aid, did, ['files']);
        if (fileId?.trim()) {
            const file = await this.loadDocumentFileRow(did, fileId.trim());
            await this.assertCustomerCanPreviewFile(file, actor.id);
            if (!file.storageKey) {
                throw new common_1.BadRequestException('Document file is not uploaded yet');
            }
            return this.s3StorageService.createPresignedGetUrl(file.storageKey);
        }
        await this.assertCustomerCanPreviewDocument(doc, actor.id);
        if (!doc.storageKey) {
            throw new common_1.BadRequestException('Document file is not uploaded yet');
        }
        return this.s3StorageService.createPresignedGetUrl(doc.storageKey);
    }
    async deleteDocumentFile(customerId, applicationId, documentId, fileId, actor) {
        const cid = this.tid(customerId);
        const aid = this.tid(applicationId);
        const did = this.tid(documentId);
        const fid = this.tid(fileId);
        await this.assertCanAccessApplication(actor, cid, aid);
        const doc = await this.loadDocumentRow(cid, aid, did, ['files']);
        this.assertDocumentIsActive(doc);
        if (actor.role === user_role_enum_1.UserRole.ASSOCIATE) {
            await this.assertCanAccessDocument(actor, did);
        }
        const file = await this.loadDocumentFileRow(did, fid);
        if (actor.role === user_role_enum_1.UserRole.CUSTOMER) {
            await this.assertCustomerCanDeleteFile(doc, file, actor.id);
        }
        if (file.storageKey?.trim()) {
            await this.s3StorageService.deleteObject(file.storageKey.trim());
        }
        await this.applicationDocumentFileRepository.delete({ id: file.id });
        this.syncDocumentStatusAfterFileChange(doc, (doc.files ?? []).filter((row) => row.id !== file.id));
        await this.applicationDocumentRepository.save(doc);
        if (actor.role === user_role_enum_1.UserRole.CUSTOMER) {
            return this.getCustomerWorkflow(cid, aid, actor);
        }
        return this.getWorkflow(cid, aid, actor);
    }
    async deleteDocumentFileForCustomerUser(applicationId, documentId, fileId, actor) {
        if (actor.role !== user_role_enum_1.UserRole.CUSTOMER) {
            throw new common_1.ForbiddenException('Only customer can use this endpoint');
        }
        const customerId = await this.customerIdForUser(actor.id);
        return this.deleteDocumentFile(customerId, applicationId, documentId, fileId, actor);
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
            'applicationDocuments.files',
            'applicationType',
        ]);
        const uploaderRoleByUserId = await this.uploaderRoleMapForDocuments(app.applicationDocuments ?? []);
        return this.buildWorkflowPayload(app, actor.id, uploaderRoleByUserId);
    }
    async buildWorkflowPayload(app, customerUserId, uploaderRoleByUserId = new Map(), options) {
        const progressRows = (app.pipelineProgress ?? [])
            .slice()
            .filter(customer_pipeline_display_1.isCustomerPipelineStepVisible)
            .sort((a, b) => a.stepIndex - b.stepIndex)
            .filter((p) => {
            if (options?.assignedPipelineProgressIds == null) {
                return true;
            }
            return options.assignedPipelineProgressIds.includes(p.id);
        });
        const assigneesByProgressId = await this.pipelineStepAssignmentService.getAssigneesByProgressIds(progressRows.map((p) => p.id));
        const documentIds = (app.applicationDocuments ?? []).map((d) => d.id);
        const documentAssigneesById = options?.includeDocumentAssignees
            ? await this.documentAssignmentService.getAssigneesByDocumentIds(documentIds)
            : new Map();
        const steps = progressRows.map((p) => ({
            id: p.id,
            stepIndex: p.stepIndex,
            title: p.title,
            isCustom: p.isCustom,
            completedAt: p.completedAt ?? null,
            assignedTo: assigneesByProgressId.get(p.id) ?? [],
        }));
        const documents = (app.applicationDocuments ?? [])
            .slice()
            .filter(customer_document_display_1.isCustomerDocumentVisible)
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .filter((d) => {
            if (options?.assignedDocumentIds == null) {
                return true;
            }
            return options.assignedDocumentIds.includes(d.id);
        })
            .map((d) => {
            const attachmentFiles = (d.files ?? []).filter((f) => !!f.uploadedAt && !!f.storageKey);
            const legacyUploadedByCustomer = customerUserId && d.uploadedAt
                ? (0, customer_document_visibility_1.isUploadedByCustomerUser)(d, customerUserId, uploaderRoleByUserId)
                : undefined;
            const customerFiles = customerUserId
                ? (0, customer_document_visibility_1.mapVisibleCustomerFiles)(d.files ?? [], customerUserId, uploaderRoleByUserId)
                : undefined;
            const adminFiles = !customerUserId
                ? attachmentFiles.map((file) => ({
                    id: file.id,
                    originalFilename: file.originalFilename ?? null,
                    mimeType: file.mimeType ?? null,
                    sizeBytes: file.sizeBytes ?? null,
                    uploadedAt: file.uploadedAt ?? null,
                    uploadedByUserId: file.uploadedByUserId ?? null,
                    storageKey: file.storageKey ?? null,
                }))
                : undefined;
            const uploadedByCustomer = customerUserId !== undefined
                ? (customerFiles?.length ?? 0) > 0 || !!legacyUploadedByCustomer
                : undefined;
            const hasAnyUpload = attachmentFiles.length > 0 || (!!d.uploadedAt && !!d.storageKey);
            const row = {
                id: d.id,
                status: d.status,
                requirementKey: d.requirementKey,
                sectionTitle: d.sectionTitle,
                itemLabel: d.itemLabel,
                sortOrder: d.sortOrder,
                isCustom: d.isCustom,
                uploaded: hasAnyUpload,
                fileCount: attachmentFiles.length + (d.uploadedAt && d.storageKey ? 1 : 0),
                originalFilename: d.originalFilename ?? null,
                mimeType: d.mimeType ?? null,
                sizeBytes: d.sizeBytes ?? null,
                uploadedAt: d.uploadedAt ?? null,
                canPreview: customerUserId
                    ? (customerFiles?.some((f) => f.canPreview) ?? false) ||
                        (0, customer_document_visibility_1.canCustomerPreviewDocument)(d, customerUserId, uploaderRoleByUserId)
                    : true,
                files: customerUserId ? customerFiles : adminFiles,
            };
            if (!customerUserId) {
                row.storageKey = d.storageKey ?? null;
                row.bucket = d.bucket ?? null;
                row.uploadedByUserId = d.uploadedByUserId ?? null;
                row.notes = d.notes ?? null;
                row.assignedTo = documentAssigneesById.get(d.id) ?? [];
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
            relations: [...relations],
        });
        if (!doc) {
            throw new common_1.NotFoundException(`Document #${documentId} not found for this application`);
        }
        return doc;
    }
    async loadDocumentFileRow(documentId, fileId) {
        const file = await this.applicationDocumentFileRepository.findOne({
            where: { id: fileId, customerApplicationDocumentId: documentId },
        });
        if (!file) {
            throw new common_1.NotFoundException(`File #${fileId} not found for this document`);
        }
        return file;
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
        const [pipelineAllowed, documentAllowed] = await Promise.all([
            this.pipelineStepAssignmentService.hasAccessToCustomer(associateProfile.id, customerId),
            this.documentAssignmentService.hasAccessToCustomer(associateProfile.id, customerId),
        ]);
        if (!pipelineAllowed && !documentAllowed) {
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
        const documentAllowed = await this.documentAssignmentService.hasAccessToApplication(associateProfile.id, applicationId);
        if (!allowed && !documentAllowed) {
            throw new common_1.ForbiddenException('You do not have access to this application');
        }
    }
    async assignedDocumentIdsForActor(actor, customerId) {
        if (actor.role !== user_role_enum_1.UserRole.ASSOCIATE) {
            return null;
        }
        const associateProfile = await this.associateProfileRepository.findOne({
            where: { userId: actor.id },
        });
        if (!associateProfile) {
            return [];
        }
        return this.documentAssignmentService.getAssignedDocumentIdsForAssociate(associateProfile.id, customerId);
    }
    async assignedPipelineProgressIdsForActor(actor, customerId, applicationId) {
        if (actor.role !== user_role_enum_1.UserRole.ASSOCIATE) {
            return null;
        }
        const associateProfile = await this.associateProfileRepository.findOne({
            where: { userId: actor.id },
        });
        if (!associateProfile) {
            return [];
        }
        return this.pipelineStepAssignmentService.getAssignedPipelineProgressIdsForAssociate(associateProfile.id, customerId, applicationId);
    }
    async assertCanAccessDocument(actor, documentId) {
        if (actor.role === user_role_enum_1.UserRole.ADMIN) {
            return;
        }
        if (actor.role !== user_role_enum_1.UserRole.ASSOCIATE) {
            throw new common_1.ForbiddenException('You do not have access to this document');
        }
        const associateProfile = await this.associateProfileRepository.findOne({
            where: { userId: actor.id },
        });
        if (!associateProfile) {
            throw new common_1.ForbiddenException('You do not have access to this document');
        }
        const allowed = await this.documentAssignmentService.hasAccessToDocument(associateProfile.id, documentId);
        if (!allowed) {
            throw new common_1.ForbiddenException('You are not assigned to this document');
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
                .flatMap((d) => [
                d.uploadedByUserId?.trim(),
                ...(d.files ?? []).map((f) => f.uploadedByUserId?.trim()),
            ])
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
    assertDocumentIsActive(doc) {
        if (!(0, customer_document_display_1.isCustomerDocumentVisible)(doc)) {
            throw new common_1.BadRequestException('This document requirement was removed for this customer');
        }
    }
    assertPipelineStepIsActive(step) {
        if (!(0, customer_pipeline_display_1.isCustomerPipelineStepVisible)(step)) {
            throw new common_1.BadRequestException('This pipeline step was removed for this customer');
        }
    }
    async assertCustomerCanUploadDocument(doc, customerUserId) {
        if (!doc.uploadedAt || !doc.storageKey) {
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
    async assertCustomerCanPreviewFile(file, customerUserId) {
        const roleMap = await this.uploaderRoleMapForDocuments([
            { uploadedByUserId: file.uploadedByUserId },
        ]);
        if (!(0, customer_document_visibility_1.canCustomerPreviewFile)(file, customerUserId, roleMap)) {
            throw new common_1.ForbiddenException('You can only preview documents you uploaded');
        }
    }
    async assertCustomerCanDeleteFile(doc, file, customerUserId) {
        if (!(0, customer_document_visibility_1.isAttachmentFileUploaded)(file)) {
            return;
        }
        const roleMap = await this.uploaderRoleMapForDocuments([doc]);
        if (!(0, customer_document_visibility_1.isFileUploadedByCustomerUser)(file, customerUserId, roleMap)) {
            throw new common_1.ForbiddenException('You can only delete files you uploaded');
        }
    }
    syncDocumentStatusAfterFileChange(doc, remainingFiles) {
        const uploadedFiles = remainingFiles.filter((f) => (0, customer_document_visibility_1.isAttachmentFileUploaded)(f));
        const hasLegacy = !!doc.uploadedAt && !!doc.storageKey;
        const hasAny = uploadedFiles.length > 0 || hasLegacy;
        if (!hasAny && doc.status === customer_application_document_status_enum_1.CustomerApplicationDocumentStatus.UPLOADED) {
            doc.status = customer_application_document_status_enum_1.CustomerApplicationDocumentStatus.PENDING;
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
    __param(3, (0, typeorm_1.InjectRepository)(customer_application_document_file_entity_1.CustomerApplicationDocumentFile)),
    __param(4, (0, typeorm_1.InjectRepository)(associate_profile_entity_1.AssociateProfile)),
    __param(7, (0, typeorm_1.InjectRepository)(customer_profile_entity_1.CustomerProfile)),
    __param(8, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        pipeline_step_assignment_service_1.PipelineStepAssignmentService,
        document_assignment_service_1.DocumentAssignmentService,
        typeorm_2.Repository,
        typeorm_2.Repository,
        s3_storage_service_1.S3StorageService])
], CustomerApplicationWorkflowService);
//# sourceMappingURL=customer-application-workflow.service.js.map