import { CustomerApplicationDocumentStatus } from '../../applications/entities/customer-application-document-status.enum';
export declare class PatchApplicationDocumentDto {
    status?: CustomerApplicationDocumentStatus;
    notes?: string;
}
