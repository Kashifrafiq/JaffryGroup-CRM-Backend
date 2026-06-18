import { User } from '../../users/entities/user.entity';
import { CustomerApplicationDocument } from './customer-application-document.entity';
export declare class CustomerApplicationDocumentFile {
    id: string;
    customerApplicationDocumentId: string;
    customerApplicationDocument: CustomerApplicationDocument;
    storageKey?: string | null;
    bucket?: string | null;
    originalFilename?: string | null;
    mimeType?: string | null;
    sizeBytes?: string | null;
    uploadedAt?: Date | null;
    uploadedByUserId?: string | null;
    uploadedByUser?: User | null;
    createdAt: Date;
}
