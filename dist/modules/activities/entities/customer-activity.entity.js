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
exports.CustomerActivity = void 0;
const typeorm_1 = require("typeorm");
const customer_profile_entity_1 = require("../../users/entities/customer-profile.entity");
const associate_profile_entity_1 = require("../../users/entities/associate-profile.entity");
let CustomerActivity = class CustomerActivity {
    id;
    customerId;
    customer;
    associateId;
    associate;
    activityType;
    details;
    createdByUserId;
    createdAt;
    updatedAt;
};
exports.CustomerActivity = CustomerActivity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], CustomerActivity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], CustomerActivity.prototype, "customerId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => customer_profile_entity_1.CustomerProfile, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'customerId' }),
    __metadata("design:type", customer_profile_entity_1.CustomerProfile)
], CustomerActivity.prototype, "customer", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Object)
], CustomerActivity.prototype, "associateId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => associate_profile_entity_1.AssociateProfile, { onDelete: 'SET NULL', nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'associateId' }),
    __metadata("design:type", Object)
], CustomerActivity.prototype, "associate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100 }),
    __metadata("design:type", String)
], CustomerActivity.prototype, "activityType", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], CustomerActivity.prototype, "details", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], CustomerActivity.prototype, "createdByUserId", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], CustomerActivity.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], CustomerActivity.prototype, "updatedAt", void 0);
exports.CustomerActivity = CustomerActivity = __decorate([
    (0, typeorm_1.Entity)('customer_activities')
], CustomerActivity);
//# sourceMappingURL=customer-activity.entity.js.map