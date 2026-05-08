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
exports.CustomerReminder = void 0;
const typeorm_1 = require("typeorm");
const customer_profile_entity_1 = require("../../users/entities/customer-profile.entity");
const associate_profile_entity_1 = require("../../users/entities/associate-profile.entity");
const customer_reminder_enums_1 = require("./customer-reminder.enums");
let CustomerReminder = class CustomerReminder {
    id;
    customerId;
    customer;
    associateId;
    associate;
    title;
    description;
    remindAt;
    status;
    createdByUserId;
    createdAt;
    updatedAt;
};
exports.CustomerReminder = CustomerReminder;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], CustomerReminder.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], CustomerReminder.prototype, "customerId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => customer_profile_entity_1.CustomerProfile, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'customerId' }),
    __metadata("design:type", customer_profile_entity_1.CustomerProfile)
], CustomerReminder.prototype, "customer", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Object)
], CustomerReminder.prototype, "associateId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => associate_profile_entity_1.AssociateProfile, { onDelete: 'SET NULL', nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'associateId' }),
    __metadata("design:type", Object)
], CustomerReminder.prototype, "associate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 200 }),
    __metadata("design:type", String)
], CustomerReminder.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], CustomerReminder.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], CustomerReminder.prototype, "remindAt", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: customer_reminder_enums_1.CustomerReminderStatus,
        default: customer_reminder_enums_1.CustomerReminderStatus.PENDING,
    }),
    __metadata("design:type", String)
], CustomerReminder.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], CustomerReminder.prototype, "createdByUserId", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], CustomerReminder.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], CustomerReminder.prototype, "updatedAt", void 0);
exports.CustomerReminder = CustomerReminder = __decorate([
    (0, typeorm_1.Entity)('customer_reminders')
], CustomerReminder);
//# sourceMappingURL=customer-reminder.entity.js.map