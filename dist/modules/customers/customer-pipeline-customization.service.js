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
exports.CustomerPipelineCustomizationService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const customer_application_pipeline_progress_entity_1 = require("../applications/entities/customer-application-pipeline-progress.entity");
const customer_application_entity_1 = require("./entities/customer-application.entity");
let CustomerPipelineCustomizationService = class CustomerPipelineCustomizationService {
    pipelineProgressRepository;
    applicationRepository;
    constructor(pipelineProgressRepository, applicationRepository) {
        this.pipelineProgressRepository = pipelineProgressRepository;
        this.applicationRepository = applicationRepository;
    }
    async applyOnCreate(customerId, overrides = [], customPipelineSteps = []) {
        if (!overrides.length && !customPipelineSteps.length) {
            return;
        }
        const apps = await this.loadApplications(customerId);
        if (overrides.length) {
            await this.applyOverrides(apps, overrides, 'create');
        }
        if (customPipelineSteps.length) {
            await this.insertCustomPipelineSteps(apps, customPipelineSteps);
        }
    }
    async applyOnUpdate(customerId, overrides = [], customPipelineSteps = []) {
        if (!overrides.length && !customPipelineSteps.length) {
            return;
        }
        const apps = await this.loadApplications(customerId);
        if (overrides.length) {
            await this.applyOverrides(apps, overrides, 'update');
        }
        if (customPipelineSteps.length) {
            await this.insertCustomPipelineSteps(apps, customPipelineSteps);
        }
    }
    async applySingleOverride(customerId, applicationId, pipelineProgressId, patch) {
        const step = await this.pipelineProgressRepository
            .createQueryBuilder('step')
            .innerJoin('step.customerApplication', 'app')
            .where('step.id = :pipelineProgressId', { pipelineProgressId })
            .andWhere('app.id = :applicationId', { applicationId })
            .andWhere('app.customerId = :customerId', { customerId })
            .getOne();
        if (!step) {
            throw new common_1.NotFoundException(`Pipeline step #${pipelineProgressId} not found for customer #${customerId}`);
        }
        this.patchPipelineRow(step, patch);
        return this.pipelineProgressRepository.save(step);
    }
    async addCustomPipelineStep(customerId, applicationId, dto) {
        const apps = await this.loadApplications(customerId);
        const app = apps.find((a) => a.id === applicationId);
        if (!app) {
            throw new common_1.NotFoundException(`Application #${applicationId} not found for customer #${customerId}`);
        }
        const [created] = await this.insertCustomPipelineSteps([app], [dto]);
        return created;
    }
    async loadApplications(customerId) {
        return this.applicationRepository.find({
            where: { customerId },
            relations: ['applicationType', 'pipelineProgress'],
        });
    }
    async applyOverrides(apps, overrides, mode) {
        for (const override of overrides) {
            const step = this.resolveStepForOverride(apps, override, mode);
            this.patchPipelineRow(step, override);
            await this.pipelineProgressRepository.save(step);
        }
    }
    resolveStepForOverride(apps, override, mode) {
        if (override.pipelineProgressId?.trim()) {
            if (mode === 'create') {
                throw new common_1.BadRequestException('pipelineProgressId is only valid when editing an existing customer');
            }
            const match = apps
                .flatMap((app) => app.pipelineProgress ?? [])
                .find((step) => step.id === override.pipelineProgressId.trim());
            if (!match) {
                throw new common_1.NotFoundException(`Pipeline step #${override.pipelineProgressId} not found for this customer`);
            }
            return match;
        }
        if (override.stepIndex === undefined) {
            throw new common_1.BadRequestException('Provide stepIndex or pipelineProgressId for pipelineOverrides');
        }
        const scopedApps = this.filterApps(apps, override);
        if (scopedApps.length !== 1) {
            throw new common_1.BadRequestException(scopedApps.length === 0
                ? `No application found for pipeline override stepIndex ${override.stepIndex}`
                : `Multiple applications match stepIndex ${override.stepIndex} — provide applicationTypeId or applicationTypeCode`);
        }
        const step = (scopedApps[0].pipelineProgress ?? []).find((row) => row.stepIndex === override.stepIndex);
        if (!step) {
            throw new common_1.NotFoundException(`No pipeline step with stepIndex ${override.stepIndex} found for this customer application`);
        }
        return step;
    }
    async insertCustomPipelineSteps(apps, customPipelineSteps) {
        const created = [];
        for (const entry of customPipelineSteps) {
            const scopedApps = this.filterApps(apps, entry);
            if (scopedApps.length !== 1) {
                throw new common_1.BadRequestException(scopedApps.length === 0
                    ? 'No application found for customPipelineSteps entry'
                    : 'Multiple applications match customPipelineSteps entry — provide applicationTypeId or applicationTypeCode');
            }
            const app = scopedApps[0];
            const maxIndex = (app.pipelineProgress ?? []).reduce((max, step) => Math.max(max, step.stepIndex), -1);
            const stepIndex = entry.stepIndex ?? maxIndex + 1;
            const existing = (app.pipelineProgress ?? []).find((step) => step.stepIndex === stepIndex);
            if (existing) {
                throw new common_1.BadRequestException(`Pipeline stepIndex ${stepIndex} already exists for this customer application`);
            }
            const row = this.pipelineProgressRepository.create({
                customerApplicationId: app.id,
                pipelineStepTemplateId: null,
                stepIndex,
                title: entry.title.trim(),
                isCustom: true,
                isActive: true,
                completedAt: null,
            });
            const saved = await this.pipelineProgressRepository.save(row);
            app.pipelineProgress = [...(app.pipelineProgress ?? []), saved];
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
    patchPipelineRow(step, patch) {
        if (patch.title !== undefined) {
            step.title = patch.title.trim();
        }
        if (patch.removed !== undefined) {
            step.isActive = !patch.removed;
        }
    }
};
exports.CustomerPipelineCustomizationService = CustomerPipelineCustomizationService;
exports.CustomerPipelineCustomizationService = CustomerPipelineCustomizationService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(customer_application_pipeline_progress_entity_1.CustomerApplicationPipelineProgress)),
    __param(1, (0, typeorm_1.InjectRepository)(customer_application_entity_1.CustomerApplication)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], CustomerPipelineCustomizationService);
//# sourceMappingURL=customer-pipeline-customization.service.js.map