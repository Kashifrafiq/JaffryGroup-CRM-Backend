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
exports.AssociateCustomer = void 0;
const typeorm_1 = require("typeorm");
const associate_profile_entity_1 = require("./associate-profile.entity");
const customer_profile_entity_1 = require("./customer-profile.entity");
let AssociateCustomer = class AssociateCustomer {
    id;
    associateId;
    customerId;
    associate;
    customer;
};
exports.AssociateCustomer = AssociateCustomer;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], AssociateCustomer.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], AssociateCustomer.prototype, "associateId", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], AssociateCustomer.prototype, "customerId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => associate_profile_entity_1.AssociateProfile, { onDelete: 'CASCADE' }),
    __metadata("design:type", associate_profile_entity_1.AssociateProfile)
], AssociateCustomer.prototype, "associate", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => customer_profile_entity_1.CustomerProfile, { onDelete: 'CASCADE' }),
    __metadata("design:type", customer_profile_entity_1.CustomerProfile)
], AssociateCustomer.prototype, "customer", void 0);
exports.AssociateCustomer = AssociateCustomer = __decorate([
    (0, typeorm_1.Entity)('associate_customers'),
    (0, typeorm_1.Unique)(['associateId', 'customerId'])
], AssociateCustomer);
//# sourceMappingURL=associate-customer.entity.js.map