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
exports.CustomersController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const user_role_enum_1 = require("../users/entities/user-role.enum");
const customers_service_1 = require("./customers.service");
const create_customer_api_dto_1 = require("./dto/create-customer-api.dto");
const list_customers_query_dto_1 = require("./dto/list-customers-query.dto");
const update_customer_dto_1 = require("./dto/update-customer.dto");
const create_customer_application_dto_1 = require("./dto/create-customer-application.dto");
const update_customer_application_dto_1 = require("./dto/update-customer-application.dto");
let CustomersController = class CustomersController {
    customersService;
    constructor(customersService) {
        this.customersService = customersService;
    }
    actor(req) {
        return { id: req.user.id, role: req.user.role };
    }
    create(dto, req) {
        return this.customersService.create(dto, this.actor(req));
    }
    findAll(query, req) {
        return this.customersService.findAll(this.actor(req), query);
    }
    findOne(customerId, req) {
        return this.customersService.findOneDetail(customerId, this.actor(req));
    }
    update(customerId, dto, req) {
        return this.customersService.updateCustomer(customerId, dto, this.actor(req));
    }
    remove(customerId, req) {
        return this.customersService.removeCustomer(customerId, this.actor(req));
    }
    addApplication(customerId, dto, req) {
        return this.customersService.addApplication(customerId, dto, this.actor(req));
    }
    updateApplication(customerId, applicationId, dto, req) {
        return this.customersService.updateApplication(customerId, applicationId, dto, this.actor(req));
    }
    removeApplication(customerId, applicationId, req) {
        return this.customersService.removeApplication(customerId, applicationId, this.actor(req));
    }
};
exports.CustomersController = CustomersController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.ASSOCIATE),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_customer_api_dto_1.CreateCustomerApiDto, Object]),
    __metadata("design:returntype", void 0)
], CustomersController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.ASSOCIATE),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [list_customers_query_dto_1.ListCustomersQueryDto, Object]),
    __metadata("design:returntype", void 0)
], CustomersController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':customerId'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.ASSOCIATE),
    __param(0, (0, common_1.Param)('customerId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], CustomersController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':customerId'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.ASSOCIATE),
    __param(0, (0, common_1.Param)('customerId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_customer_dto_1.UpdateCustomerDto, Object]),
    __metadata("design:returntype", void 0)
], CustomersController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':customerId'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.ADMIN),
    __param(0, (0, common_1.Param)('customerId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], CustomersController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)(':customerId/applications'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.ASSOCIATE),
    __param(0, (0, common_1.Param)('customerId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_customer_application_dto_1.CreateCustomerApplicationDto, Object]),
    __metadata("design:returntype", void 0)
], CustomersController.prototype, "addApplication", null);
__decorate([
    (0, common_1.Patch)(':customerId/applications/:applicationId'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.ASSOCIATE),
    __param(0, (0, common_1.Param)('customerId')),
    __param(1, (0, common_1.Param)('applicationId')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, update_customer_application_dto_1.UpdateCustomerApplicationDto, Object]),
    __metadata("design:returntype", void 0)
], CustomersController.prototype, "updateApplication", null);
__decorate([
    (0, common_1.Delete)(':customerId/applications/:applicationId'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.ADMIN),
    __param(0, (0, common_1.Param)('customerId')),
    __param(1, (0, common_1.Param)('applicationId')),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], CustomersController.prototype, "removeApplication", null);
exports.CustomersController = CustomersController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('customers'),
    __metadata("design:paramtypes", [customers_service_1.CustomersService])
], CustomersController);
//# sourceMappingURL=customers.controller.js.map