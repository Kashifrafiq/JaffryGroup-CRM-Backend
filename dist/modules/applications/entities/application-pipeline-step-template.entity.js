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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApplicationPipelineStepTemplate = void 0;
const typeorm_1 = require("typeorm");
const application_type_entity_1 = require("./application-type.entity");
let ApplicationPipelineStepTemplate = class ApplicationPipelineStepTemplate {
    id;
    applicationTypeId;
    applicationType;
    stepIndex;
    title;
};
exports.ApplicationPipelineStepTemplate = ApplicationPipelineStepTemplate;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], ApplicationPipelineStepTemplate.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], ApplicationPipelineStepTemplate.prototype, "applicationTypeId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => application_type_entity_1.ApplicationType, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'applicationTypeId' }),
    __metadata("design:type", application_type_entity_1.ApplicationType)
], ApplicationPipelineStepTemplate.prototype, "applicationType", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], ApplicationPipelineStepTemplate.prototype, "stepIndex", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 512 }),
    __metadata("design:type", String)
], ApplicationPipelineStepTemplate.prototype, "title", void 0);
exports.ApplicationPipelineStepTemplate = ApplicationPipelineStepTemplate = __decorate([
    (0, typeorm_1.Entity)('application_pipeline_step_templates'),
    (0, typeorm_1.Unique)(['applicationTypeId', 'stepIndex'])
], ApplicationPipelineStepTemplate);
//# sourceMappingURL=application-pipeline-step-template.entity.js.map