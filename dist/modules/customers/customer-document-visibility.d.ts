import { UserRole } from '../users/entities/user-role.enum';
export type DocumentUploaderFields = {
    uploadedAt?: Date | null;
    uploadedByUserId?: string | null;
    storageKey?: string | null;
};
export declare function isUploadedByCustomerUser(doc: DocumentUploaderFields, customerUserId: string, uploaderRoleByUserId: Map<string, UserRole>): boolean;
export declare function isDocumentFileUploaded(doc: DocumentUploaderFields): boolean;
export declare function canCustomerPreviewDocument(doc: DocumentUploaderFields, customerUserId: string, uploaderRoleByUserId: Map<string, UserRole>): boolean;
