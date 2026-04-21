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
exports.ApplicationTypesController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const user_role_enum_1 = require("../users/entities/user-role.enum");
const application_types_service_1 = require("./application-types.service");
let ApplicationTypesController = class ApplicationTypesController {
    applicationTypesService;
    constructor(applicationTypesService) {
        this.applicationTypesService = applicationTypesService;
    }
    findActive() {
        return this.applicationTypesService.findActive().then((rows) => rows.map((t) => ({
            id: t.id,
            code: t.code,
            name: t.name,
            sortOrder: t.sortOrder,
        })));
    }
};
exports.ApplicationTypesController = ApplicationTypesController;
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.ASSOCIATE),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ApplicationTypesController.prototype, "findActive", null);
exports.ApplicationTypesController = ApplicationTypesController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('application-types'),
    __metadata("design:paramtypes", [application_types_service_1.ApplicationTypesService])
], ApplicationTypesController);
//# sourceMappingURL=application-types.controller.js.map