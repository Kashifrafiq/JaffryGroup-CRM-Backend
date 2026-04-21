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
exports.CustomerApplicationWorkflowController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const user_role_enum_1 = require("../users/entities/user-role.enum");
const customer_application_workflow_service_1 = require("./customer-application-workflow.service");
const patch_pipeline_step_dto_1 = require("./dto/patch-pipeline-step.dto");
const presign_document_upload_dto_1 = require("./dto/presign-document-upload.dto");
const complete_document_upload_dto_1 = require("./dto/complete-document-upload.dto");
const patch_application_document_dto_1 = require("./dto/patch-application-document.dto");
let CustomerApplicationWorkflowController = class CustomerApplicationWorkflowController {
    workflowService;
    constructor(workflowService) {
        this.workflowService = workflowService;
    }
    actor(req) {
        return { id: req.user.id, role: req.user.role };
    }
    getWorkflow(customerId, applicationId, req) {
        return this.workflowService.getWorkflow(customerId, applicationId, this.actor(req));
    }
    patchPipelineStep(customerId, applicationId, stepIndex, dto, req) {
        return this.workflowService.patchPipelineStep(customerId, applicationId, stepIndex, dto.completed, this.actor(req));
    }
    presignUpload(customerId, applicationId, documentId, dto, req) {
        return this.workflowService.presignDocumentUpload(customerId, applicationId, documentId, dto, this.actor(req));
    }
    completeUpload(customerId, applicationId, documentId, dto, req) {
        return this.workflowService.completeDocumentUpload(customerId, applicationId, documentId, dto, this.actor(req));
    }
    patchDocument(customerId, applicationId, documentId, dto, req) {
        return this.workflowService.patchDocument(customerId, applicationId, documentId, dto, this.actor(req));
    }
};
exports.CustomerApplicationWorkflowController = CustomerApplicationWorkflowController;
__decorate([
    (0, common_1.Get)(':customerId/applications/:applicationId/workflow'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.ASSOCIATE),
    __param(0, (0, common_1.Param)('customerId')),
    __param(1, (0, common_1.Param)('applicationId')),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], CustomerApplicationWorkflowController.prototype, "getWorkflow", null);
__decorate([
    (0, common_1.Patch)(':customerId/applications/:applicationId/pipeline-steps/:stepIndex'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.ASSOCIATE),
    __param(0, (0, common_1.Param)('customerId')),
    __param(1, (0, common_1.Param)('applicationId')),
    __param(2, (0, common_1.Param)('stepIndex', common_1.ParseIntPipe)),
    __param(3, (0, common_1.Body)()),
    __param(4, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Number, patch_pipeline_step_dto_1.PatchPipelineStepDto, Object]),
    __metadata("design:returntype", void 0)
], CustomerApplicationWorkflowController.prototype, "patchPipelineStep", null);
__decorate([
    (0, common_1.Post)(':customerId/applications/:applicationId/documents/:documentId/presign'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.ASSOCIATE),
    __param(0, (0, common_1.Param)('customerId')),
    __param(1, (0, common_1.Param)('applicationId')),
    __param(2, (0, common_1.Param)('documentId')),
    __param(3, (0, common_1.Body)()),
    __param(4, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, presign_document_upload_dto_1.PresignDocumentUploadDto, Object]),
    __metadata("design:returntype", void 0)
], CustomerApplicationWorkflowController.prototype, "presignUpload", null);
__decorate([
    (0, common_1.Post)(':customerId/applications/:applicationId/documents/:documentId/complete'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.ASSOCIATE),
    __param(0, (0, common_1.Param)('customerId')),
    __param(1, (0, common_1.Param)('applicationId')),
    __param(2, (0, common_1.Param)('documentId')),
    __param(3, (0, common_1.Body)()),
    __param(4, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, complete_document_upload_dto_1.CompleteDocumentUploadDto, Object]),
    __metadata("design:returntype", void 0)
], CustomerApplicationWorkflowController.prototype, "completeUpload", null);
__decorate([
    (0, common_1.Patch)(':customerId/applications/:applicationId/documents/:documentId'),
    (0, roles_decorator_1.Roles)(user_role_enum_1.UserRole.ADMIN, user_role_enum_1.UserRole.ASSOCIATE),
    __param(0, (0, common_1.Param)('customerId')),
    __param(1, (0, common_1.Param)('applicationId')),
    __param(2, (0, common_1.Param)('documentId')),
    __param(3, (0, common_1.Body)()),
    __param(4, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, patch_application_document_dto_1.PatchApplicationDocumentDto, Object]),
    __metadata("design:returntype", void 0)
], CustomerApplicationWorkflowController.prototype, "patchDocument", null);
exports.CustomerApplicationWorkflowController = CustomerApplicationWorkflowController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('customers'),
    __metadata("design:paramtypes", [customer_application_workflow_service_1.CustomerApplicationWorkflowService])
], CustomerApplicationWorkflowController);
//# sourceMappingURL=customer-application-workflow.controller.js.map