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
exports.CustomerDocumentCustomizationService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const crypto_1 = require("crypto");
const typeorm_2 = require("typeorm");
const customer_application_document_entity_1 = require("../applications/entities/customer-application-document.entity");
const customer_application_document_status_enum_1 = require("../applications/entities/customer-application-document-status.enum");
const customer_application_entity_1 = require("./entities/customer-application.entity");
let CustomerDocumentCustomizationService = class CustomerDocumentCustomizationService {
    documentRepository;
    applicationRepository;
    constructor(documentRepository, applicationRepository) {
        this.documentRepository = documentRepository;
        this.applicationRepository = applicationRepository;
    }
    async applyOnCreate(customerId, overrides = [], customDocuments = []) {
        if (!overrides.length && !customDocuments.length) {
            return;
        }
        const apps = await this.loadApplications(customerId);
        if (overrides.length) {
            await this.applyOverrides(apps, overrides, 'create');
        }
        if (customDocuments.length) {
            await this.insertCustomDocuments(apps, customDocuments);
        }
    }
    async applyOnUpdate(customerId, overrides = [], customDocuments = []) {
        if (!overrides.length && !customDocuments.length) {
            return;
        }
        const apps = await this.loadApplications(customerId);
        if (overrides.length) {
            await this.applyOverrides(apps, overrides, 'update');
        }
        if (customDocuments.length) {
            await this.insertCustomDocuments(apps, customDocuments);
        }
    }
    async applySingleOverride(customerId, applicationId, documentId, patch) {
        const doc = await this.documentRepository
            .createQueryBuilder('doc')
            .innerJoin('doc.customerApplication', 'app')
            .where('doc.id = :documentId', { documentId })
            .andWhere('doc.customerApplicationId = :applicationId', { applicationId })
            .andWhere('app.customerId = :customerId', { customerId })
            .getOne();
        if (!doc) {
            throw new common_1.NotFoundException(`Document #${documentId} not found for customer #${customerId}`);
        }
        this.patchDocumentRow(doc, patch);
        return this.documentRepository.save(doc);
    }
    async addCustomDocument(customerId, applicationId, dto) {
        const apps = await this.loadApplications(customerId);
        const app = apps.find((a) => a.id === applicationId);
        if (!app) {
            throw new common_1.NotFoundException(`Application #${applicationId} not found for customer #${customerId}`);
        }
        const [created] = await this.insertCustomDocuments([app], [dto]);
        return created;
    }
    async loadApplications(customerId) {
        return this.applicationRepository.find({
            where: { customerId },
            relations: ['applicationType', 'applicationDocuments'],
        });
    }
    async applyOverrides(apps, overrides, mode) {
        for (const override of overrides) {
            const doc = this.resolveDocumentForOverride(apps, override, mode);
            this.patchDocumentRow(doc, override);
            await this.documentRepository.save(doc);
        }
    }
    resolveDocumentForOverride(apps, override, mode) {
        if (override.documentId?.trim()) {
            if (mode === 'create') {
                throw new common_1.BadRequestException('documentId is only valid when editing an existing customer');
            }
            const match = apps
                .flatMap((app) => app.applicationDocuments ?? [])
                .find((doc) => doc.id === override.documentId.trim());
            if (!match) {
                throw new common_1.NotFoundException(`Document #${override.documentId} not found for this customer`);
            }
            return match;
        }
        const requirementKey = override.requirementKey?.trim();
        if (!requirementKey) {
            throw new common_1.BadRequestException('Provide requirementKey or documentId for documentOverrides');
        }
        const scopedApps = this.filterApps(apps, override);
        if (scopedApps.length !== 1) {
            throw new common_1.BadRequestException(scopedApps.length === 0
                ? `No application found for document override requirementKey "${requirementKey}"`
                : `Multiple applications match requirementKey "${requirementKey}" — provide applicationTypeId or applicationTypeCode`);
        }
        const doc = (scopedApps[0].applicationDocuments ?? []).find((row) => row.requirementKey === requirementKey);
        if (!doc) {
            throw new common_1.NotFoundException(`No document with requirementKey "${requirementKey}" found for this customer application`);
        }
        return doc;
    }
    async insertCustomDocuments(apps, customDocuments) {
        const created = [];
        for (const entry of customDocuments) {
            const scopedApps = this.filterApps(apps, entry);
            if (scopedApps.length !== 1) {
                throw new common_1.BadRequestException(scopedApps.length === 0
                    ? 'No application found for customDocuments entry'
                    : 'Multiple applications match customDocuments entry — provide applicationTypeId or applicationTypeCode');
            }
            const app = scopedApps[0];
            const maxSort = (app.applicationDocuments ?? []).reduce((max, d) => Math.max(max, d.sortOrder), -1);
            const sortOrder = entry.sortOrder ?? maxSort + 1;
            const id = (0, crypto_1.randomUUID)();
            const row = this.documentRepository.create({
                customerApplicationId: app.id,
                documentRequirementId: null,
                requirementKey: `custom_${id.replace(/-/g, '').slice(0, 12)}`,
                sectionTitle: entry.sectionTitle.trim(),
                itemLabel: entry.itemLabel.trim(),
                sortOrder,
                isCustom: true,
                isActive: true,
                status: customer_application_document_status_enum_1.CustomerApplicationDocumentStatus.PENDING,
            });
            const saved = await this.documentRepository.save(row);
            app.applicationDocuments = [...(app.applicationDocuments ?? []), saved];
            created.push(saved);
        }
        return created;
    }
    filterApps(apps, ref) {
        if (ref.applicationTypeId?.trim()) {
            return apps.filter((app) => app.applicationTypeId === ref.applicationTypeId.trim());
        }
        if (ref.applicationTypeCode?.trim()) {
            const code = ref.applicationTypeCode.trim().toLowerCase();
            return apps.filter((app) => app.applicationType?.code === code);
        }
        if (apps.length === 1) {
            return apps;
        }
        return apps;
    }
    patchDocumentRow(doc, patch) {
        if (patch.itemLabel !== undefined) {
            doc.itemLabel = patch.itemLabel.trim();
        }
        if (patch.sectionTitle !== undefined) {
            doc.sectionTitle = patch.sectionTitle.trim();
        }
        if (patch.sortOrder !== undefined) {
            doc.sortOrder = patch.sortOrder;
        }
        if (patch.removed !== undefined) {
            doc.isActive = !patch.removed;
        }
    }
};
exports.CustomerDocumentCustomizationService = CustomerDocumentCustomizationService;
exports.CustomerDocumentCustomizationService = CustomerDocumentCustomizationService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(customer_application_document_entity_1.CustomerApplicationDocument)),
    __param(1, (0, typeorm_1.InjectRepository)(customer_application_entity_1.CustomerApplication)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], CustomerDocumentCustomizationService);
//# sourceMappingURL=customer-document-customization.service.js.map