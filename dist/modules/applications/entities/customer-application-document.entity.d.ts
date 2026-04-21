import { ApplicationDocumentRequirement } from './application-document-requirement.entity';
import { CustomerApplicationDocumentStatus } from './customer-application-document-status.enum';
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
    notes?: string | null;
    createdAt: Date;
    updatedAt: Date;
}
