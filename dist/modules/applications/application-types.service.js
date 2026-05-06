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
exports.ApplicationTypesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const application_type_entity_1 = require("./entities/application-type.entity");
const application_pipeline_step_template_entity_1 = require("./entities/application-pipeline-step-template.entity");
const application_document_requirement_entity_1 = require("./entities/application-document-requirement.entity");
let ApplicationTypesService = class ApplicationTypesService {
    applicationTypeRepository;
    pipelineTemplateRepository;
    documentRequirementRepository;
    constructor(applicationTypeRepository, pipelineTemplateRepository, documentRequirementRepository) {
        this.applicationTypeRepository = applicationTypeRepository;
        this.pipelineTemplateRepository = pipelineTemplateRepository;
        this.documentRequirementRepository = documentRequirementRepository;
    }
    findActive() {
        return this.applicationTypeRepository.find({
            where: { isActive: true },
            order: { sortOrder: 'ASC', name: 'ASC' },
        });
    }
    async findActiveById(id) {
        const row = await this.applicationTypeRepository.findOne({
            where: { id, isActive: true },
        });
        if (!row) {
            throw new common_1.NotFoundException('Application type not found or inactive');
        }
        return row;
    }
    async findActiveByCode(code) {
        const normalized = code.trim().toLowerCase();
        return this.applicationTypeRepository.findOne({
            where: { code: normalized, isActive: true },
        });
    }
    async findActiveByNameIgnoreCase(name) {
        return this.applicationTypeRepository
            .createQueryBuilder('t')
            .where('t.isActive = true')
            .andWhere('LOWER(t.name) = LOWER(:n)', { n: name.trim() })
            .getOne();
    }
    async getWorkflowTemplate(applicationTypeId) {
        const normalizedTypeId = applicationTypeId.trim();
        const type = await this.findActiveById(normalizedTypeId);
        const [pipelineRows, documentRows] = await Promise.all([
            this.pipelineTemplateRepository.find({
                where: { applicationTypeId: normalizedTypeId },
                order: { stepIndex: 'ASC' },
            }),
            this.documentRequirementRepository.find({
                where: { applicationTypeId: normalizedTypeId },
                order: { sortOrder: 'ASC' },
            }),
        ]);
        return {
            applicationType: {
                id: type.id,
                code: type.code,
                name: type.name,
            },
            pipelineSteps: pipelineRows.map((row) => ({
                stepIndex: row.stepIndex,
                title: row.title,
            })),
            documents: documentRows.map((row) => ({
                id: row.id,
                requirementKey: row.requirementKey,
                sectionTitle: row.sectionTitle,
                itemLabel: row.itemLabel,
                sortOrder: row.sortOrder,
            })),
        };
    }
};
exports.ApplicationTypesService = ApplicationTypesService;
exports.ApplicationTypesService = ApplicationTypesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(application_type_entity_1.ApplicationType)),
    __param(1, (0, typeorm_1.InjectRepository)(application_pipeline_step_template_entity_1.ApplicationPipelineStepTemplate)),
    __param(2, (0, typeorm_1.InjectRepository)(application_document_requirement_entity_1.ApplicationDocumentRequirement)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], ApplicationTypesService);
//# sourceMappingURL=application-types.service.js.map