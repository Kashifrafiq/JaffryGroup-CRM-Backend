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
exports.CustomerApplicationDocumentFile = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("../../users/entities/user.entity");
const customer_application_document_entity_1 = require("./customer-application-document.entity");
let CustomerApplicationDocumentFile = class CustomerApplicationDocumentFile {
    id;
    customerApplicationDocumentId;
    customerApplicationDocument;
    storageKey;
    bucket;
    originalFilename;
    mimeType;
    sizeBytes;
    uploadedAt;
    uploadedByUserId;
    uploadedByUser;
    createdAt;
};
exports.CustomerApplicationDocumentFile = CustomerApplicationDocumentFile;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], CustomerApplicationDocumentFile.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], CustomerApplicationDocumentFile.prototype, "customerApplicationDocumentId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => customer_application_document_entity_1.CustomerApplicationDocument, (doc) => doc.files, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'customerApplicationDocumentId' }),
    __metadata("design:type", customer_application_document_entity_1.CustomerApplicationDocument)
], CustomerApplicationDocumentFile.prototype, "customerApplicationDocument", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 1024, nullable: true }),
    __metadata("design:type", Object)
], CustomerApplicationDocumentFile.prototype, "storageKey", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", Object)
], CustomerApplicationDocumentFile.prototype, "bucket", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 512, nullable: true }),
    __metadata("design:type", Object)
], CustomerApplicationDocumentFile.prototype, "originalFilename", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", Object)
], CustomerApplicationDocumentFile.prototype, "mimeType", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'bigint', nullable: true }),
    __metadata("design:type", Object)
], CustomerApplicationDocumentFile.prototype, "sizeBytes", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', nullable: true }),
    __metadata("design:type", Object)
], CustomerApplicationDocumentFile.prototype, "uploadedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    __metadata("design:type", Object)
], CustomerApplicationDocumentFile.prototype, "uploadedByUserId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { onDelete: 'SET NULL', nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'uploadedByUserId' }),
    __metadata("design:type", Object)
], CustomerApplicationDocumentFile.prototype, "uploadedByUser", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], CustomerApplicationDocumentFile.prototype, "createdAt", void 0);
exports.CustomerApplicationDocumentFile = CustomerApplicationDocumentFile = __decorate([
    (0, typeorm_1.Entity)('customer_application_document_files')
], CustomerApplicationDocumentFile);
//# sourceMappingURL=customer-application-document-file.entity.js.map