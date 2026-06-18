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
var PipelineStepAssignmentService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PipelineStepAssignmentService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const associate_pipeline_step_entity_1 = require("../users/entities/associate-pipeline-step.entity");
const associate_profile_entity_1 = require("../users/entities/associate-profile.entity");
const customer_application_pipeline_progress_entity_1 = require("../applications/entities/customer-application-pipeline-progress.entity");
const customer_application_entity_1 = require("./entities/customer-application.entity");
let PipelineStepAssignmentService = PipelineStepAssignmentService_1 = class PipelineStepAssignmentService {
    assignmentRepository;
    associateProfileRepository;
    pipelineProgressRepository;
    applicationRepository;
    logger = new common_1.Logger(PipelineStepAssignmentService_1.name);
    constructor(assignmentRepository, associateProfileRepository, pipelineProgressRepository, applicationRepository) {
        this.assignmentRepository = assignmentRepository;
        this.associateProfileRepository = associateProfileRepository;
        this.pipelineProgressRepository = pipelineProgressRepository;
        this.applicationRepository = applicationRepository;
    }
    async resolvePipelineProgress(customerId, applicationId, stepIndex) {
        const app = await this.applicationRepository.findOne({
            where: { id: applicationId, customerId },
            select: ['id'],
        });
        if (!app) {
            throw new common_1.NotFoundException(`Application #${applicationId} not found for this customer`);
        }
        const row = await this.pipelineProgressRepository.findOne({
            where: { customerApplicationId: applicationId, stepIndex },
        });
        if (!row) {
            throw new common_1.NotFoundException(`Pipeline step ${stepIndex} not found for this application`);
        }
        return row;
    }
    async assignAssociatesToStep(pipelineProgressId, associateIds) {
        const progress = await this.pipelineProgressRepository.findOne({
            where: { id: pipelineProgressId },
        });
        if (!progress) {
            throw new common_1.NotFoundException('Pipeline step not found');
        }
        const uniqueAssociateIds = [...new Set(associateIds.map((id) => id.trim()).filter(Boolean))];
        const assignedAssociateIds = [];
        for (const associateId of uniqueAssociateIds) {
            const associate = await this.associateProfileRepository.findOne({ where: { id: associateId } });
            if (!associate) {
                throw new common_1.NotFoundException(`Associate ${associateId} not found`);
            }
            const existing = await this.assignmentRepository.findOne({
                where: { associateId, pipelineProgressId },
            });
            if (!existing) {
                await this.assignmentRepository.save(this.assignmentRepository.create({ associateId, pipelineProgressId }));
            }
            assignedAssociateIds.push(associateId);
        }
        return { pipelineProgressId, assignedAssociateIds, totalAssigned: assignedAssociateIds.length };
    }
    async unassignAssociateFromStep(pipelineProgressId, associateId) {
        const result = await this.assignmentRepository.delete({ pipelineProgressId, associateId });
        return {
            pipelineProgressId,
            associateId,
            removed: (result.affected ?? 0) > 0,
        };
    }
    async replaceAssociatesOnStep(pipelineProgressId, associateIds) {
        await this.assignmentRepository.delete({ pipelineProgressId });
        if (!associateIds.length) {
            return { pipelineProgressId, assignedAssociateIds: [], totalAssigned: 0 };
        }
        return this.assignAssociatesToStep(pipelineProgressId, associateIds);
    }
    async assignAllStepsForCustomerToAssociate(customerId, associateId) {
        const associate = await this.associateProfileRepository.findOne({ where: { id: associateId } });
        if (!associate) {
            throw new common_1.NotFoundException(`Associate ${associateId} not found`);
        }
        const apps = await this.applicationRepository.find({
            where: { customerId },
            select: ['id'],
        });
        if (!apps.length) {
            return 0;
        }
        const progressRows = await this.pipelineProgressRepository.find({
            where: { customerApplicationId: (0, typeorm_2.In)(apps.map((a) => a.id)) },
            select: ['id'],
        });
        let assigned = 0;
        for (const row of progressRows) {
            const existing = await this.assignmentRepository.findOne({
                where: { associateId, pipelineProgressId: row.id },
            });
            if (!existing) {
                await this.assignmentRepository.save(this.assignmentRepository.create({ associateId, pipelineProgressId: row.id }));
                assigned += 1;
            }
        }
        return assigned;
    }
    async getCustomerIdsForAssociate(associateId) {
        const links = await this.assignmentRepository
            .createQueryBuilder('aps')
            .innerJoin('aps.pipelineProgress', 'pp')
            .innerJoin('pp.customerApplication', 'app')
            .where('aps.associateId = :associateId', { associateId })
            .select('DISTINCT app.customerId', 'customerId')
            .getRawMany();
        return links.map((r) => r.customerId);
    }
    async hasAccessToCustomer(associateId, customerId) {
        const count = await this.assignmentRepository
            .createQueryBuilder('aps')
            .innerJoin('aps.pipelineProgress', 'pp')
            .innerJoin('pp.customerApplication', 'app')
            .where('aps.associateId = :associateId', { associateId })
            .andWhere('app.customerId = :customerId', { customerId })
            .getCount();
        return count > 0;
    }
    async hasAccessToApplication(associateId, customerApplicationId) {
        const count = await this.assignmentRepository
            .createQueryBuilder('aps')
            .innerJoin('aps.pipelineProgress', 'pp')
            .where('aps.associateId = :associateId', { associateId })
            .andWhere('pp.customerApplicationId = :customerApplicationId', { customerApplicationId })
            .getCount();
        return count > 0;
    }
    async hasAccessToStep(associateId, customerApplicationId, stepIndex) {
        const count = await this.assignmentRepository
            .createQueryBuilder('aps')
            .innerJoin('aps.pipelineProgress', 'pp')
            .where('aps.associateId = :associateId', { associateId })
            .andWhere('pp.customerApplicationId = :customerApplicationId', { customerApplicationId })
            .andWhere('pp.stepIndex = :stepIndex', { stepIndex })
            .getCount();
        return count > 0;
    }
    async getAssignedPipelineProgressIdsForAssociate(associateId, customerId, applicationId) {
        const qb = this.assignmentRepository
            .createQueryBuilder('aps')
            .innerJoin('aps.pipelineProgress', 'pp')
            .innerJoin('pp.customerApplication', 'app')
            .where('aps.associateId = :associateId', { associateId })
            .andWhere('app.customerId = :customerId', { customerId })
            .select('pp.id', 'pipelineProgressId');
        if (applicationId?.trim()) {
            qb.andWhere('app.id = :applicationId', { applicationId: applicationId.trim() });
        }
        const rows = await qb.getRawMany();
        return rows.map((r) => r.pipelineProgressId);
    }
    async getAssigneesByProgressIds(progressIds) {
        const result = new Map();
        if (!progressIds.length) {
            return result;
        }
        const links = await this.assignmentRepository.find({
            where: { pipelineProgressId: (0, typeorm_2.In)(progressIds) },
            relations: ['associate'],
        });
        for (const link of links) {
            const assignees = result.get(link.pipelineProgressId) ?? [];
            assignees.push({
                id: link.associate.id,
                name: `${link.associate.firstName} ${link.associate.lastName}`.trim(),
            });
            result.set(link.pipelineProgressId, assignees);
        }
        return result;
    }
    async getAssigneesForCustomerApplications(customerId) {
        const apps = await this.applicationRepository.find({
            where: { customerId },
            relations: ['pipelineProgress'],
        });
        const progressIds = apps.flatMap((a) => (a.pipelineProgress ?? []).map((p) => p.id));
        const assigneesByProgressId = await this.getAssigneesByProgressIds(progressIds);
        const byApplication = new Map();
        for (const app of apps) {
            const stepMap = new Map();
            for (const step of app.pipelineProgress ?? []) {
                stepMap.set(step.stepIndex, assigneesByProgressId.get(step.id) ?? []);
            }
            byApplication.set(app.id, stepMap);
        }
        return byApplication;
    }
};
exports.PipelineStepAssignmentService = PipelineStepAssignmentService;
exports.PipelineStepAssignmentService = PipelineStepAssignmentService = PipelineStepAssignmentService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(associate_pipeline_step_entity_1.AssociatePipelineStep)),
    __param(1, (0, typeorm_1.InjectRepository)(associate_profile_entity_1.AssociateProfile)),
    __param(2, (0, typeorm_1.InjectRepository)(customer_application_pipeline_progress_entity_1.CustomerApplicationPipelineProgress)),
    __param(3, (0, typeorm_1.InjectRepository)(customer_application_entity_1.CustomerApplication)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], PipelineStepAssignmentService);
//# sourceMappingURL=pipeline-step-assignment.service.js.map