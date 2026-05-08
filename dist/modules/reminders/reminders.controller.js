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
Object.defineProperty(exports, "__esModule", { value: true });
exports.RemindersController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const user_role_enum_1 = require("../users/entities/user-role.enum");
const reminders_service_1 = require("./reminders.service");
const create_customer_reminder_dto_1 = require("./dto/create-customer-reminder.dto");
const update_customer_reminder_dto_1 = require("./dto/update-customer-reminder.dto");
let RemindersController = class RemindersController {
    remindersService;
    constructor(remindersService) {
        this.remindersService = remindersService;
    }
    create(customerId, dto, req) {
        return this.remindersService.create(customerId, dto, req.user);
    }
    findByCustomer(customerId, req) {
        return this.remindersService.findByCustomer(customerId, req.user);
    }
    findOne(customerId, reminderId, req) {
        return this.remindersService.findOne(customerId, reminderId, req.user);
    }
    update(customerId, reminderId, dto, req) {
        return this.remindersService.update(customerId, reminderId, dto, req.user);
    }
    remove(customerId, reminderId, req) {
        return this.remindersService.remove(customerId, reminderId, req.user);
    }
};
exports.RemindersController = RemindersController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.ASSOCIATE),
    __param(0, (0, common_1.Param)('customerId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_customer_reminder_dto_1.CreateCustomerReminderDto, Object]),
    __metadata("design:returntype", void 0)
], RemindersController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.ASSOCIATE),
    __param(0, (0, common_1.Param)('customerId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], RemindersController.prototype, "findByCustomer", null);
__decorate([
    (0, common_1.Get)(':reminderId'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.ASSOCIATE),
    __param(0, (0, common_1.Param)('customerId')),
    __param(1, (0, common_1.Param)('reminderId')),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], RemindersController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':reminderId'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.ASSOCIATE),
    __param(0, (0, common_1.Param)('customerId')),
    __param(1, (0, common_1.Param)('reminderId')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, update_customer_reminder_dto_1.UpdateCustomerReminderDto, Object]),
    __metadata("design:returntype", void 0)
], RemindersController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':reminderId'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.ASSOCIATE),
    __param(0, (0, common_1.Param)('customerId')),
    __param(1, (0, common_1.Param)('reminderId')),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], RemindersController.prototype, "remove", null);
exports.RemindersController = RemindersController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('customers/:customerId/reminders'),
    __metadata("design:paramtypes", [reminders_service_1.RemindersService])
], RemindersController);
//# sourceMappingURL=reminders.controller.js.map