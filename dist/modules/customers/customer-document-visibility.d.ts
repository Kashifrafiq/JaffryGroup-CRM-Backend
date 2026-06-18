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
export declare function isUploadedByCustomerUser(doc: DocumentUploaderFields, customerUserId: string, uploaderRoleByUserId: Map<string, UserRole>): boolean;
export declare function isFileUploadedByCustomerUser(file: DocumentFileUploaderFields, customerUserId: string, uploaderRoleByUserId: Map<string, UserRole>): boolean;
export declare function isDocumentFileUploaded(doc: DocumentUploaderFields): boolean;
export declare function isAttachmentFileUploaded(file: DocumentFileUploaderFields): boolean;
export declare function canCustomerPreviewDocument(doc: DocumentUploaderFields, customerUserId: string, uploaderRoleByUserId: Map<string, UserRole>): boolean;
export declare function canCustomerPreviewFile(file: DocumentFileUploaderFields, customerUserId: string, uploaderRoleByUserId: Map<string, UserRole>): boolean;
export declare function mapVisibleCustomerFiles<T extends DocumentFileUploaderFields & {
    id: string;
    originalFilename?: string | null;
    uploadedAt?: Date | null;
}>(files: T[], customerUserId: string, uploaderRoleByUserId: Map<string, UserRole>): Array<{
    id: string;
    originalFilename: string | null;
    uploadedAt: Date | null;
    uploadedByMe: boolean;
    canPreview: boolean;
}>;
