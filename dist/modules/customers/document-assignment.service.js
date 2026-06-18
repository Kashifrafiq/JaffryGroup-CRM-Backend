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
exports.DocumentAssignmentService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const associate_customer_application_document_entity_1 = require("../users/entities/associate-customer-application-document.entity");
const associate_profile_entity_1 = require("../users/entities/associate-profile.entity");
const customer_application_document_entity_1 = require("../applications/entities/customer-application-document.entity");
const customer_application_entity_1 = require("./entities/customer-application.entity");
let DocumentAssignmentService = class DocumentAssignmentService {
    assignmentRepository;
    associateProfileRepository;
    documentRepository;
    applicationRepository;
    constructor(assignmentRepository, associateProfileRepository, documentRepository, applicationRepository) {
        this.assignmentRepository = assignmentRepository;
        this.associateProfileRepository = associateProfileRepository;
        this.documentRepository = documentRepository;
        this.applicationRepository = applicationRepository;
    }
    async replaceAssociatesOnDocument(documentId, associateIds) {
        const document = await this.documentRepository.findOne({ where: { id: documentId } });
        if (!document) {
            throw new common_1.NotFoundException(`Document #${documentId} not found`);
        }
        await this.assignmentRepository.delete({ customerApplicationDocumentId: documentId });
        if (!associateIds.length) {
            return { documentId, assignedAssociateIds: [], totalAssigned: 0 };
        }
        return this.assignAssociatesToDocument(documentId, associateIds);
    }
    async assignAssociatesToDocument(documentId, associateIds) {
        const document = await this.documentRepository.findOne({ where: { id: documentId } });
        if (!document) {
            throw new common_1.NotFoundException(`Document #${documentId} not found`);
        }
        const uniqueAssociateIds = [...new Set(associateIds.map((id) => id.trim()).filter(Boolean))];
        const assignedAssociateIds = [];
        for (const associateId of uniqueAssociateIds) {
            const associate = await this.associateProfileRepository.findOne({ where: { id: associateId } });
            if (!associate) {
                throw new common_1.NotFoundException(`Associate ${associateId} not found`);
            }
            const existing = await this.assignmentRepository.findOne({
                where: { associateId, customerApplicationDocumentId: documentId },
            });
            if (!existing) {
                await this.assignmentRepository.save(this.assignmentRepository.create({
                    associateId,
                    customerApplicationDocumentId: documentId,
                }));
            }
            assignedAssociateIds.push(associateId);
        }
        return { documentId, assignedAssociateIds, totalAssigned: assignedAssociateIds.length };
    }
    async applyAssignmentsOnCreate(customerId, assignments) {
        if (!assignments.length) {
            return;
        }
        const apps = await this.applicationRepository.find({
            where: { customerId },
            relations: ['applicationType', 'applicationDocuments', 'applicationDocuments.requirement'],
        });
        const documents = apps.flatMap((app) => (app.applicationDocuments ?? []).map((doc) => ({
            doc,
            applicationTypeId: app.applicationTypeId,
            applicationTypeCode: app.applicationType?.code ?? null,
        })));
        for (const assignment of assignments) {
            const matches = documents.filter(({ doc, applicationTypeId, applicationTypeCode }) => {
                if (doc.requirement.requirementKey !== assignment.requirementKey.trim()) {
                    return false;
                }
                if (assignment.applicationTypeId?.trim()) {
                    return applicationTypeId === assignment.applicationTypeId.trim();
                }
                if (assignment.applicationTypeCode?.trim()) {
                    return applicationTypeCode === assignment.applicationTypeCode.trim();
                }
                return true;
            });
            if (matches.length !== 1) {
                throw new common_1.BadRequestException(matches.length === 0
                    ? `No document found for requirementKey "${assignment.requirementKey}"`
                    : `Multiple documents match requirementKey "${assignment.requirementKey}" — provide applicationTypeId or applicationTypeCode`);
            }
            await this.replaceAssociatesOnDocument(matches[0].doc.id, assignment.associateIds);
        }
    }
    async applyAssignmentsOnUpdate(customerId, assignments) {
        if (!assignments.length) {
            return;
        }
        const documentIds = [...new Set(assignments.map((a) => a.documentId.trim()).filter(Boolean))];
        const documents = await this.documentRepository
            .createQueryBuilder('doc')
            .innerJoin('doc.customerApplication', 'app')
            .where('doc.id IN (:...documentIds)', { documentIds })
            .andWhere('app.customerId = :customerId', { customerId })
            .getMany();
        const documentById = new Map(documents.map((doc) => [doc.id, doc]));
        for (const assignment of assignments) {
            const documentId = assignment.documentId.trim();
            if (!documentById.has(documentId)) {
                throw new common_1.NotFoundException(`Document #${documentId} not found for customer #${customerId}`);
            }
            await this.replaceAssociatesOnDocument(documentId, assignment.associateIds);
        }
    }
    async getCustomerIdsForAssociate(associateId) {
        const links = await this.assignmentRepository
            .createQueryBuilder('ada')
            .innerJoin('ada.customerApplicationDocument', 'doc')
            .innerJoin('doc.customerApplication', 'app')
            .where('ada.associateId = :associateId', { associateId })
            .select('DISTINCT app.customerId', 'customerId')
            .getRawMany();
        return links.map((r) => r.customerId);
    }
    async hasAccessToCustomer(associateId, customerId) {
        const count = await this.assignmentRepository
            .createQueryBuilder('ada')
            .innerJoin('ada.customerApplicationDocument', 'doc')
            .innerJoin('doc.customerApplication', 'app')
            .where('ada.associateId = :associateId', { associateId })
            .andWhere('app.customerId = :customerId', { customerId })
            .getCount();
        return count > 0;
    }
    async hasAccessToDocument(associateId, documentId) {
        const count = await this.assignmentRepository.count({
            where: { associateId, customerApplicationDocumentId: documentId },
        });
        return count > 0;
    }
    async hasAccessToApplication(associateId, customerApplicationId) {
        const count = await this.assignmentRepository
            .createQueryBuilder('ada')
            .innerJoin('ada.customerApplicationDocument', 'doc')
            .where('ada.associateId = :associateId', { associateId })
            .andWhere('doc.customerApplicationId = :customerApplicationId', { customerApplicationId })
            .getCount();
        return count > 0;
    }
    async getAssignedDocumentIdsForAssociate(associateId, customerId) {
        const qb = this.assignmentRepository
            .createQueryBuilder('ada')
            .innerJoin('ada.customerApplicationDocument', 'doc')
            .innerJoin('doc.customerApplication', 'app')
            .where('ada.associateId = :associateId', { associateId })
            .select('doc.id', 'documentId');
        if (customerId) {
            qb.andWhere('app.customerId = :customerId', { customerId });
        }
        const rows = await qb.getRawMany();
        return rows.map((r) => r.documentId);
    }
    async getAssigneesByDocumentIds(documentIds) {
        const result = new Map();
        if (!documentIds.length) {
            return result;
        }
        const links = await this.assignmentRepository.find({
            where: { customerApplicationDocumentId: (0, typeorm_2.In)(documentIds) },
            relations: ['associate'],
        });
        for (const link of links) {
            const assignees = result.get(link.customerApplicationDocumentId) ?? [];
            assignees.push({
                id: link.associate.id,
                name: `${link.associate.firstName} ${link.associate.lastName}`.trim(),
            });
            result.set(link.customerApplicationDocumentId, assignees);
        }
        return result;
    }
};
exports.DocumentAssignmentService = DocumentAssignmentService;
exports.DocumentAssignmentService = DocumentAssignmentService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(associate_customer_application_document_entity_1.AssociateCustomerApplicationDocument)),
    __param(1, (0, typeorm_1.InjectRepository)(associate_profile_entity_1.AssociateProfile)),
    __param(2, (0, typeorm_1.InjectRepository)(customer_application_document_entity_1.CustomerApplicationDocument)),
    __param(3, (0, typeorm_1.InjectRepository)(customer_application_entity_1.CustomerApplication)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], DocumentAssignmentService);
//# sourceMappingURL=document-assignment.service.js.map