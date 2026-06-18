"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isUploadedByCustomerUser = isUploadedByCustomerUser;
exports.isFileUploadedByCustomerUser = isFileUploadedByCustomerUser;
exports.isDocumentFileUploaded = isDocumentFileUploaded;
exports.isAttachmentFileUploaded = isAttachmentFileUploaded;
exports.canCustomerPreviewDocument = canCustomerPreviewDocument;
exports.canCustomerPreviewFile = canCustomerPreviewFile;
exports.mapVisibleCustomerFiles = mapVisibleCustomerFiles;
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
function isFileUploadedByCustomerUser(file, customerUserId, uploaderRoleByUserId) {
    if (!file.uploadedAt || !file.uploadedByUserId || !file.storageKey) {
        return false;
    }
    if (file.uploadedByUserId !== customerUserId) {
        return false;
    }
    return uploaderRoleByUserId.get(file.uploadedByUserId) === user_role_enum_1.UserRole.CUSTOMER;
}
function isDocumentFileUploaded(doc) {
    return !!doc.uploadedAt && !!doc.storageKey;
}
function isAttachmentFileUploaded(file) {
    return !!file.uploadedAt && !!file.storageKey;
}
function canCustomerPreviewDocument(doc, customerUserId, uploaderRoleByUserId) {
    return (!!doc.storageKey &&
        isUploadedByCustomerUser(doc, customerUserId, uploaderRoleByUserId));
}
function canCustomerPreviewFile(file, customerUserId, uploaderRoleByUserId) {
    return isFileUploadedByCustomerUser(file, customerUserId, uploaderRoleByUserId);
}
function mapVisibleCustomerFiles(files, customerUserId, uploaderRoleByUserId) {
    return files
        .filter((file) => isFileUploadedByCustomerUser(file, customerUserId, uploaderRoleByUserId))
        .map((file) => ({
        id: file.id,
        originalFilename: file.originalFilename ?? null,
        uploadedAt: file.uploadedAt ?? null,
        uploadedByMe: true,
        canPreview: canCustomerPreviewFile(file, customerUserId, uploaderRoleByUserId),
    }));
}
//# sourceMappingURL=customer-document-visibility.js.map