"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isUploadedByCustomerUser = isUploadedByCustomerUser;
exports.isDocumentFileUploaded = isDocumentFileUploaded;
exports.canCustomerPreviewDocument = canCustomerPreviewDocument;
const user_role_enum_1 = require("../users/entities/user-role.enum");
function isUploadedByCustomerUser(doc, customerUserId, uploaderRoleByUserId) {
    if (!doc.uploadedAt || !doc.uploadedByUserId) {
        return false;
    }
    if (doc.uploadedByUserId !== customerUserId) {
        return false;
    }
    return uploaderRoleByUserId.get(doc.uploadedByUserId) === user_role_enum_1.UserRole.CUSTOMER;
}
function isDocumentFileUploaded(doc) {
    return !!doc.uploadedAt;
}
function canCustomerPreviewDocument(doc, customerUserId, uploaderRoleByUserId) {
    return (!!doc.storageKey &&
        isUploadedByCustomerUser(doc, customerUserId, uploaderRoleByUserId));
}
//# sourceMappingURL=customer-document-visibility.js.map