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
exports.CustomerApplication = void 0;
const typeorm_1 = require("typeorm");
const customer_profile_entity_1 = require("../../users/entities/customer-profile.entity");
const application_type_entity_1 = require("../../applications/entities/application-type.entity");
const customer_application_status_enum_1 = require("./customer-application-status.enum");
let CustomerApplication = class CustomerApplication {
    id;
    customer;
    customerId;
    applicationType;
    applicationTypeId;
    status;
    pipeline;
    pipelineProgress;
    applicationDocuments;
    createdAt;
    updatedAt;
};
exports.CustomerApplication = CustomerApplication;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], CustomerApplication.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => customer_profile_entity_1.CustomerProfile, (c) => c.applications, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'customerId' }),
    __metadata("design:type", customer_profile_entity_1.CustomerProfile)
], CustomerApplication.prototype, "customer", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], CustomerApplication.prototype, "customerId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => application_type_entity_1.ApplicationType, { onDelete: 'RESTRICT' }),
    (0, typeorm_1.JoinColumn)({ name: 'applicationTypeId' }),
    __metadata("design:type", application_type_entity_1.ApplicationType)
], CustomerApplication.prototype, "applicationType", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], CustomerApplication.prototype, "applicationTypeId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 32, default: customer_application_status_enum_1.CustomerApplicationStatus.DRAFT }),
    __metadata("design:type", String)
], CustomerApplication.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], CustomerApplication.prototype, "pipeline", void 0);
__decorate([
    (0, typeorm_1.OneToMany)('CustomerApplicationPipelineProgress', 'customerApplication'),
    __metadata("design:type", Array)
], CustomerApplication.prototype, "pipelineProgress", void 0);
__decorate([
    (0, typeorm_1.OneToMany)('CustomerApplicationDocument', 'customerApplication'),
    __metadata("design:type", Array)
], CustomerApplication.prototype, "applicationDocuments", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], CustomerApplication.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], CustomerApplication.prototype, "updatedAt", void 0);
exports.CustomerApplication = CustomerApplication = __decorate([
    (0, typeorm_1.Entity)('customer_applications')
], CustomerApplication);
//# sourceMappingURL=customer-application.entity.js.map