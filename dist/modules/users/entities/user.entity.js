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
exports.User = exports.UserRole = void 0;
const typeorm_1 = require("typeorm");
const admin_profile_entity_1 = require("./admin-profile.entity");
const associate_profile_entity_1 = require("./associate-profile.entity");
const customer_profile_entity_1 = require("./customer-profile.entity");
var UserRole;
(function (UserRole) {
    UserRole["ADMIN"] = "admin";
    UserRole["ASSOCIATE"] = "associate";
    UserRole["CUSTOMER"] = "customer";
})(UserRole || (exports.UserRole = UserRole = {}));
let User = class User {
    id;
    email;
    password;
    firstName;
    lastName;
    phoneNumber;
    address;
    dateOfBirth;
    profilePhoto;
    role;
    isActive;
    adminProfile;
    associateProfile;
    customerProfile;
    customers;
    associates;
    createdAt;
    updatedAt;
};
exports.User = User;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], User.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ unique: true }),
    __metadata("design:type", String)
], User.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.Column)({ select: false }),
    __metadata("design:type", String)
], User.prototype, "password", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], User.prototype, "firstName", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], User.prototype, "lastName", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], User.prototype, "phoneNumber", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], User.prototype, "address", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Date)
], User.prototype, "dateOfBirth", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], User.prototype, "profilePhoto", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: UserRole,
        default: UserRole.CUSTOMER,
    }),
    __metadata("design:type", String)
], User.prototype, "role", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], User.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => admin_profile_entity_1.AdminProfile, (adminProfile) => adminProfile.user),
    __metadata("design:type", admin_profile_entity_1.AdminProfile)
], User.prototype, "adminProfile", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => associate_profile_entity_1.AssociateProfile, (associateProfile) => associateProfile.user),
    __metadata("design:type", associate_profile_entity_1.AssociateProfile)
], User.prototype, "associateProfile", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => customer_profile_entity_1.CustomerProfile, (customerProfile) => customerProfile.user),
    __metadata("design:type", customer_profile_entity_1.CustomerProfile)
], User.prototype, "customerProfile", void 0);
__decorate([
    (0, typeorm_1.ManyToMany)(() => User, (user) => user.customers),
    (0, typeorm_1.JoinTable)({
        name: 'associate_customers',
        joinColumn: { name: 'associateId' },
        inverseJoinColumn: { name: 'customerId' },
    }),
    __metadata("design:type", Array)
], User.prototype, "customers", void 0);
__decorate([
    (0, typeorm_1.ManyToMany)(() => User, (user) => user.associates),
    __metadata("design:type", Array)
], User.prototype, "associates", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], User.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], User.prototype, "updatedAt", void 0);
exports.User = User = __decorate([
    (0, typeorm_1.Entity)('users')
], User);
//# sourceMappingURL=user.entity.js.map