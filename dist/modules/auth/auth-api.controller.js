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
exports.AuthApiController = void 0;
const common_1 = require("@nestjs/common");
const auth_service_1 = require("./auth.service");
const admin_login_dto_1 = require("./dto/admin-login.dto");
let AuthApiController = class AuthApiController {
    authService;
    constructor(authService) {
        this.authService = authService;
    }
    health() {
        return {
            ok: true,
            login: 'POST /api/auth/admin-login',
            associateLogin: 'POST /api/auth/associate-login',
        };
    }
    adminLoginHelp() {
        return {
            ok: false,
            reason: 'Login must be POST with JSON body (not a browser tab GET).',
            method: 'POST',
            path: '/api/auth/admin-login',
            bodyExample: {
                email: 'kashif@vanestone.tech',
                password: 'your-password',
            },
            headers: { 'Content-Type': 'application/json' },
        };
    }
    adminLogin(adminLoginDto) {
        return this.authService.adminLogin(adminLoginDto);
    }
    associateLoginHelp() {
        return {
            ok: false,
            reason: 'Login must be POST with JSON body (not a browser tab GET).',
            method: 'POST',
            path: '/api/auth/associate-login',
            bodyExample: {
                email: 'associate@example.com',
                password: 'your-password',
            },
            headers: { 'Content-Type': 'application/json' },
        };
    }
    associateLogin(associateLoginDto) {
        return this.authService.associateLogin(associateLoginDto);
    }
};
exports.AuthApiController = AuthApiController;
__decorate([
    (0, common_1.Get)('health'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AuthApiController.prototype, "health", null);
__decorate([
    (0, common_1.Get)('admin-login'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AuthApiController.prototype, "adminLoginHelp", null);
__decorate([
    (0, common_1.Post)('admin-login'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [admin_login_dto_1.AdminLoginDto]),
    __metadata("design:returntype", void 0)
], AuthApiController.prototype, "adminLogin", null);
__decorate([
    (0, common_1.Get)('associate-login'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AuthApiController.prototype, "associateLoginHelp", null);
__decorate([
    (0, common_1.Post)('associate-login'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [admin_login_dto_1.AdminLoginDto]),
    __metadata("design:returntype", void 0)
], AuthApiController.prototype, "associateLogin", null);
exports.AuthApiController = AuthApiController = __decorate([
    (0, common_1.Controller)('api/auth'),
    __metadata("design:paramtypes", [auth_service_1.AuthService])
], AuthApiController);
//# sourceMappingURL=auth-api.controller.js.map