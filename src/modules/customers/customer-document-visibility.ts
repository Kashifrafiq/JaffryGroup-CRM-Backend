import { UserRole } from '../users/entities/user-role.enum';

export type DocumentUploaderFields = {
  uploadedAt?: Date | null;
  uploadedByUserId?: string | null;
  storageKey?: string | null;
};

/** True only when this customer user uploaded the file (not admin/associate). */
export function isUploadedByCustomerUser(
  doc: DocumentUploaderFields,
  customerUserId: string,
  uploaderRoleByUserId: Map<string, UserRole>,
): boolean {
  if (!doc.uploadedAt || !doc.uploadedByUserId) {
    return false;
  }
  if (doc.uploadedByUserId !== customerUserId) {
    return false;
  }
  return uploaderRoleByUserId.get(doc.uploadedByUserId) === UserRole.CUSTOMER;
}

/** Requirement has a file on record (customer or team). */
export function isDocumentFileUploaded(doc: DocumentUploaderFields): boolean {
  return !!doc.uploadedAt;
}

export function canCustomerPreviewDocument(
  doc: DocumentUploaderFields,
  customerUserId: string,
  uploaderRoleByUserId: Map<string, UserRole>,
): boolean {
  return (
    !!doc.storageKey &&
    isUploadedByCustomerUser(doc, customerUserId, uploaderRoleByUserId)
  );
}
