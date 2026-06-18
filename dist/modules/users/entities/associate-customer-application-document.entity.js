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
exports.AssociateCustomerApplicationDocument = void 0;
const typeorm_1 = require("typeorm");
const associate_profile_entity_1 = require("./associate-profile.entity");
const customer_application_document_entity_1 = require("../../applications/entities/customer-application-document.entity");
let AssociateCustomerApplicationDocument = class AssociateCustomerApplicationDocument {
    id;
    associateId;
    customerApplicationDocumentId;
    associate;
    customerApplicationDocument;
};
exports.AssociateCustomerApplicationDocument = AssociateCustomerApplicationDocument;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], AssociateCustomerApplicationDocument.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], AssociateCustomerApplicationDocument.prototype, "associateId", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], AssociateCustomerApplicationDocument.prototype, "customerApplicationDocumentId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => associate_profile_entity_1.AssociateProfile, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'associateId' }),
    __metadata("design:type", associate_profile_entity_1.AssociateProfile)
], AssociateCustomerApplicationDocument.prototype, "associate", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => customer_application_document_entity_1.CustomerApplicationDocument, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'customerApplicationDocumentId' }),
    __metadata("design:type", customer_application_document_entity_1.CustomerApplicationDocument)
], AssociateCustomerApplicationDocument.prototype, "customerApplicationDocument", void 0);
exports.AssociateCustomerApplicationDocument = AssociateCustomerApplicationDocument = __decorate([
    (0, typeorm_1.Entity)('associate_customer_application_documents'),
    (0, typeorm_1.Unique)(['associateId', 'customerApplicationDocumentId'])
], AssociateCustomerApplicationDocument);
//# sourceMappingURL=associate-customer-application-document.entity.js.map