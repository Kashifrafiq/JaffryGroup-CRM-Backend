import { ApplicationDocumentRequirement } from './application-document-requirement.entity';
import { CustomerApplicationDocumentStatus } from './customer-application-document-status.enum';
import { User } from '../../users/entities/user.entity';
import { CustomerApplicationDocumentFile } from './customer-application-document-file.entity';
export declare class CustomerApplicationDocument {
    id: string;
    customerApplicationId: string;
    customerApplication: unknown;
    documentRequirementId: string;
    requirement: ApplicationDocumentRequirement;
    status: CustomerApplicationDocumentStatus;
    storageKey?: string | null;
    bucket?: string | null;
    originalFilename?: string | null;
    mimeType?: string | null;
    sizeBytes?: string | null;
    uploadedAt?: Date | null;
    uploadedByUserId?: string | null;
    uploadedByUser?: User | null;
    notes?: string | null;
    files?: CustomerApplicationDocumentFile[];
    createdAt: Date;
    updatedAt: Date;
}
