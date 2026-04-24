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
var ApplicationWorkflowTemplatesSeedService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApplicationWorkflowTemplatesSeedService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const application_type_entity_1 = require("./entities/application-type.entity");
const application_pipeline_step_template_entity_1 = require("./entities/application-pipeline-step-template.entity");
const application_document_requirement_entity_1 = require("./entities/application-document-requirement.entity");
const customer_application_document_entity_1 = require("./entities/customer-application-document.entity");
const workflow_documents_data_1 = require("./data/workflow-documents.data");
const workflow_pipelines_data_1 = require("./data/workflow-pipelines.data");
let ApplicationWorkflowTemplatesSeedService = ApplicationWorkflowTemplatesSeedService_1 = class ApplicationWorkflowTemplatesSeedService {
    applicationTypeRepository;
    pipelineTemplateRepository;
    documentRequirementRepository;
    customerApplicationDocumentRepository;
    logger = new common_1.Logger(ApplicationWorkflowTemplatesSeedService_1.name);
    constructor(applicationTypeRepository, pipelineTemplateRepository, documentRequirementRepository, customerApplicationDocumentRepository) {
        this.applicationTypeRepository = applicationTypeRepository;
        this.pipelineTemplateRepository = pipelineTemplateRepository;
        this.documentRequirementRepository = documentRequirementRepository;
        this.customerApplicationDocumentRepository = customerApplicationDocumentRepository;
    }
    async seedTemplates() {
        const types = await this.applicationTypeRepository.find();
        for (const type of types) {
            const code = type.code.trim().toLowerCase();
            await this.syncPipelineTemplates(type.id, code);
            await this.syncDocumentTemplates(type.id, code);
        }
        this.logger.log('Application workflow templates synced (pipelines + document requirements)');
    }
    async syncPipelineTemplates(applicationTypeId, code) {
        const titles = [...(0, workflow_pipelines_data_1.pipelineTitlesForApplicationTypeCode)(code)];
        await this.pipelineTemplateRepository.delete({ applicationTypeId });
        if (!titles.length) {
            return;
        }
        await this.pipelineTemplateRepository.save(titles.map((title, stepIndex) => this.pipelineTemplateRepository.create({
            applicationTypeId,
            stepIndex,
            title,
        })));
    }
    async syncDocumentTemplates(applicationTypeId, code) {
        const sections = workflow_documents_data_1.DOCUMENT_SECTIONS_BY_CODE[code];
        const existing = await this.documentRequirementRepository.find({
            where: { applicationTypeId },
        });
        const referencedCounts = await this.getRequirementReferenceCounts(existing.map((r) => r.id));
        const existingByKey = new Map(existing.map((r) => [r.requirementKey, r]));
        const desiredKeys = new Set();
        if (sections?.length) {
            for (let si = 0; si < sections.length; si++) {
                const section = sections[si];
                for (let ii = 0; ii < section.items.length; ii++) {
                    desiredKeys.add(`${code}_s${si}_i${ii}`);
                }
            }
        }
        if (!sections?.length) {
            const deletableIds = [];
            for (const row of existing) {
                const refCount = referencedCounts.get(row.id) ?? 0;
                if (refCount === 0) {
                    deletableIds.push(row.id);
                }
                else {
                    this.logger.warn(`Skipping delete of document requirement "${row.requirementKey}" (${row.id}); still referenced by ${refCount} customer document row(s).`);
                }
            }
            if (deletableIds.length) {
                await this.documentRequirementRepository.delete({ id: (0, typeorm_2.In)(deletableIds) });
            }
            return;
        }
        let sortOrder = 0;
        const rowsToSave = [];
        for (let si = 0; si < sections.length; si++) {
            const section = sections[si];
            for (let ii = 0; ii < section.items.length; ii++) {
                const requirementKey = `${code}_s${si}_i${ii}`;
                const itemLabel = section.items[ii];
                const prev = existingByKey.get(requirementKey);
                if (prev) {
                    prev.sectionTitle = section.sectionTitle;
                    prev.itemLabel = itemLabel;
                    prev.sortOrder = sortOrder++;
                    rowsToSave.push(prev);
                }
                else {
                    rowsToSave.push(this.documentRequirementRepository.create({
                        applicationTypeId,
                        requirementKey,
                        sectionTitle: section.sectionTitle,
                        itemLabel,
                        sortOrder: sortOrder++,
                    }));
                }
            }
        }
        if (rowsToSave.length) {
            await this.documentRequirementRepository.save(rowsToSave);
        }
        const staleDeletableIds = [];
        for (const row of existing) {
            if (desiredKeys.has(row.requirementKey)) {
                continue;
            }
            const refCount = referencedCounts.get(row.id) ?? 0;
            if (refCount === 0) {
                staleDeletableIds.push(row.id);
            }
            else {
                this.logger.warn(`Keeping stale document requirement "${row.requirementKey}" (${row.id}); still referenced by ${refCount} customer document row(s).`);
            }
        }
        if (staleDeletableIds.length) {
            await this.documentRequirementRepository.delete({ id: (0, typeorm_2.In)(staleDeletableIds) });
        }
    }
    async getRequirementReferenceCounts(requirementIds) {
        if (!requirementIds.length) {
            return new Map();
        }
        const raw = await this.customerApplicationDocumentRepository
            .createQueryBuilder('cad')
            .select('cad.documentRequirementId', 'id')
            .addSelect('COUNT(*)', 'count')
            .where('cad.documentRequirementId IN (:...ids)', { ids: requirementIds })
            .groupBy('cad.documentRequirementId')
            .getRawMany();
        return new Map(raw.map((row) => [row.id, Number(row.count)]));
    }
};
exports.ApplicationWorkflowTemplatesSeedService = ApplicationWorkflowTemplatesSeedService;
exports.ApplicationWorkflowTemplatesSeedService = ApplicationWorkflowTemplatesSeedService = ApplicationWorkflowTemplatesSeedService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(application_type_entity_1.ApplicationType)),
    __param(1, (0, typeorm_1.InjectRepository)(application_pipeline_step_template_entity_1.ApplicationPipelineStepTemplate)),
    __param(2, (0, typeorm_1.InjectRepository)(application_document_requirement_entity_1.ApplicationDocumentRequirement)),
    __param(3, (0, typeorm_1.InjectRepository)(customer_application_document_entity_1.CustomerApplicationDocument)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], ApplicationWorkflowTemplatesSeedService);
//# sourceMappingURL=application-workflow-templates.seed.service.js.map