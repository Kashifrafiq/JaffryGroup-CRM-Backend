"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApplicationWorkflowService = void 0;
const common_1 = require("@nestjs/common");
const application_pipeline_step_template_entity_1 = require("./entities/application-pipeline-step-template.entity");
const application_document_requirement_entity_1 = require("./entities/application-document-requirement.entity");
const customer_application_pipeline_progress_entity_1 = require("./entities/customer-application-pipeline-progress.entity");
const customer_application_document_entity_1 = require("./entities/customer-application-document.entity");
const customer_application_document_status_enum_1 = require("./entities/customer-application-document-status.enum");
let ApplicationWorkflowService = class ApplicationWorkflowService {
    async instantiateForNewApplication(manager, customerApplicationId, applicationTypeId) {
        const pipelineTemplates = await manager.find(application_pipeline_step_template_entity_1.ApplicationPipelineStepTemplate, {
            where: { applicationTypeId },
            order: { stepIndex: 'ASC' },
        });
        for (const t of pipelineTemplates) {
            await manager.save(customer_application_pipeline_progress_entity_1.CustomerApplicationPipelineProgress, manager.create(customer_application_pipeline_progress_entity_1.CustomerApplicationPipelineProgress, {
                customerApplicationId,
                stepIndex: t.stepIndex,
                title: t.title,
                completedAt: null,
            }));
        }
        const docTemplates = await manager.find(application_document_requirement_entity_1.ApplicationDocumentRequirement, {
            where: { applicationTypeId },
            order: { sortOrder: 'ASC' },
        });
        for (const d of docTemplates) {
            await manager.save(customer_application_document_entity_1.CustomerApplicationDocument, manager.create(customer_application_document_entity_1.CustomerApplicationDocument, {
                customerApplicationId,
                documentRequirementId: d.id,
                status: customer_application_document_status_enum_1.CustomerApplicationDocumentStatus.PENDING,
            }));
        }
    }
};
exports.ApplicationWorkflowService = ApplicationWorkflowService;
exports.ApplicationWorkflowService = ApplicationWorkflowService = __decorate([
    (0, common_1.Injectable)()
], ApplicationWorkflowService);
//# sourceMappingURL=application-workflow.service.js.map