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
exports.CustomerApplicationDocument = void 0;
const typeorm_1 = require("typeorm");
const application_document_requirement_entity_1 = require("./application-document-requirement.entity");
const customer_application_document_status_enum_1 = require("./customer-application-document-status.enum");
let CustomerApplicationDocument = class CustomerApplicationDocument {
    id;
    customerApplicationId;
    customerApplication;
    documentRequirementId;
    requirement;
    status;
    storageKey;
    bucket;
    originalFilename;
    mimeType;
    sizeBytes;
    uploadedAt;
    uploadedByUserId;
    notes;
    createdAt;
    updatedAt;
};
exports.CustomerApplicationDocument = CustomerApplicationDocument;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], CustomerApplicationDocument.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], CustomerApplicationDocument.prototype, "customerApplicationId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)('CustomerApplication', { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'customerApplicationId' }),
    __metadata("design:type", Object)
], CustomerApplicationDocument.prototype, "customerApplication", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], CustomerApplicationDocument.prototype, "documentRequirementId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => application_document_requirement_entity_1.ApplicationDocumentRequirement, { onDelete: 'RESTRICT' }),
    (0, typeorm_1.JoinColumn)({ name: 'documentRequirementId' }),
    __metadata("design:type", application_document_requirement_entity_1.ApplicationDocumentRequirement)
], CustomerApplicationDocument.prototype, "requirement", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        length: 24,
        default: customer_application_document_status_enum_1.CustomerApplicationDocumentStatus.PENDING,
    }),
    __metadata("design:type", String)
], CustomerApplicationDocument.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 1024, nullable: true }),
    __metadata("design:type", Object)
], CustomerApplicationDocument.prototype, "storageKey", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", Object)
], CustomerApplicationDocument.prototype, "bucket", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 512, nullable: true }),
    __metadata("design:type", Object)
], CustomerApplicationDocument.prototype, "originalFilename", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", Object)
], CustomerApplicationDocument.prototype, "mimeType", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'bigint', nullable: true }),
    __metadata("design:type", Object)
], CustomerApplicationDocument.prototype, "sizeBytes", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', nullable: true }),
    __metadata("design:type", Object)
], CustomerApplicationDocument.prototype, "uploadedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    __metadata("design:type", Object)
], CustomerApplicationDocument.prototype, "uploadedByUserId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], CustomerApplicationDocument.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], CustomerApplicationDocument.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], CustomerApplicationDocument.prototype, "updatedAt", void 0);
exports.CustomerApplicationDocument = CustomerApplicationDocument = __decorate([
    (0, typeorm_1.Entity)('customer_application_documents'),
    (0, typeorm_1.Unique)(['customerApplicationId', 'documentRequirementId'])
], CustomerApplicationDocument);
//# sourceMappingURL=customer-application-document.entity.js.map