"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApplicationsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const application_type_entity_1 = require("./entities/application-type.entity");
const application_pipeline_step_template_entity_1 = require("./entities/application-pipeline-step-template.entity");
const application_document_requirement_entity_1 = require("./entities/application-document-requirement.entity");
const customer_application_pipeline_progress_entity_1 = require("./entities/customer-application-pipeline-progress.entity");
const customer_application_document_entity_1 = require("./entities/customer-application-document.entity");
const application_types_controller_1 = require("./application-types.controller");
const application_types_service_1 = require("./application-types.service");
const applications_seed_service_1 = require("./applications.seed.service");
const application_workflow_templates_seed_service_1 = require("./application-workflow-templates.seed.service");
const application_workflow_service_1 = require("./application-workflow.service");
const s3_storage_service_1 = require("./s3-storage.service");
let ApplicationsModule = class ApplicationsModule {
};
exports.ApplicationsModule = ApplicationsModule;
exports.ApplicationsModule = ApplicationsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                application_type_entity_1.ApplicationType,
                application_pipeline_step_template_entity_1.ApplicationPipelineStepTemplate,
                application_document_requirement_entity_1.ApplicationDocumentRequirement,
                customer_application_pipeline_progress_entity_1.CustomerApplicationPipelineProgress,
                customer_application_document_entity_1.CustomerApplicationDocument,
            ]),
        ],
        controllers: [application_types_controller_1.ApplicationTypesController],
        providers: [
            application_types_service_1.ApplicationTypesService,
            applications_seed_service_1.ApplicationsSeedService,
            application_workflow_templates_seed_service_1.ApplicationWorkflowTemplatesSeedService,
            application_workflow_service_1.ApplicationWorkflowService,
            s3_storage_service_1.S3StorageService,
        ],
        exports: [
            application_types_service_1.ApplicationTypesService,
            application_workflow_service_1.ApplicationWorkflowService,
            s3_storage_service_1.S3StorageService,
            typeorm_1.TypeOrmModule,
        ],
    })
], ApplicationsModule);
//# sourceMappingURL=applications.module.js.map