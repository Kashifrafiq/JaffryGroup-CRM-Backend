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
exports.CustomerApplicationPipelineProgress = void 0;
const typeorm_1 = require("typeorm");
let CustomerApplicationPipelineProgress = class CustomerApplicationPipelineProgress {
    id;
    customerApplicationId;
    customerApplication;
    stepIndex;
    title;
    completedAt;
    createdAt;
    updatedAt;
};
exports.CustomerApplicationPipelineProgress = CustomerApplicationPipelineProgress;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], CustomerApplicationPipelineProgress.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], CustomerApplicationPipelineProgress.prototype, "customerApplicationId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)('CustomerApplication', { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'customerApplicationId' }),
    __metadata("design:type", Object)
], CustomerApplicationPipelineProgress.prototype, "customerApplication", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], CustomerApplicationPipelineProgress.prototype, "stepIndex", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 512 }),
    __metadata("design:type", String)
], CustomerApplicationPipelineProgress.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', nullable: true }),
    __metadata("design:type", Object)
], CustomerApplicationPipelineProgress.prototype, "completedAt", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], CustomerApplicationPipelineProgress.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], CustomerApplicationPipelineProgress.prototype, "updatedAt", void 0);
exports.CustomerApplicationPipelineProgress = CustomerApplicationPipelineProgress = __decorate([
    (0, typeorm_1.Entity)('customer_application_pipeline_progress'),
    (0, typeorm_1.Unique)(['customerApplicationId', 'stepIndex'])
], CustomerApplicationPipelineProgress);
//# sourceMappingURL=customer-application-pipeline-progress.entity.js.map