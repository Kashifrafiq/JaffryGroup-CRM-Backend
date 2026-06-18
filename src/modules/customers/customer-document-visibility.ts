import { UserRole } from '../users/entities/user-role.enum';

export type DocumentUploaderFields = {
  uploadedAt?: Date | null;
  uploadedByUserId?: string | null;
  storageKey?: string | null;
};

export type DocumentFileUploaderFields = {
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

export function isFileUploadedByCustomerUser(
  file: DocumentFileUploaderFields,
  customerUserId: string,
  uploaderRoleByUserId: Map<string, UserRole>,
): boolean {
  if (!file.uploadedAt || !file.uploadedByUserId || !file.storageKey) {
    return false;
  }
  if (file.uploadedByUserId !== customerUserId) {
    return false;
  }
  return uploaderRoleByUserId.get(file.uploadedByUserId) === UserRole.CUSTOMER;
}

/** Legacy single-file row on parent document. */
export function isDocumentFileUploaded(doc: DocumentUploaderFields): boolean {
  return !!doc.uploadedAt && !!doc.storageKey;
}

export function isAttachmentFileUploaded(file: DocumentFileUploaderFields): boolean {
  return !!file.uploadedAt && !!file.storageKey;
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

export function canCustomerPreviewFile(
  file: DocumentFileUploaderFields,
  customerUserId: string,
  uploaderRoleByUserId: Map<string, UserRole>,
): boolean {
  return isFileUploadedByCustomerUser(file, customerUserId, uploaderRoleByUserId);
}

export function mapVisibleCustomerFiles<T extends DocumentFileUploaderFields & { id: string; originalFilename?: string | null; uploadedAt?: Date | null }>(
  files: T[],
  customerUserId: string,
  uploaderRoleByUserId: Map<string, UserRole>,
): Array<{
  id: string;
  originalFilename: string | null;
  uploadedAt: Date | null;
  uploadedByMe: boolean;
  canPreview: boolean;
}> {
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
