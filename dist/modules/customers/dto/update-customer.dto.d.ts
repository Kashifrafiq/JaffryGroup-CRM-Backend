import { DocumentAssignmentDto } from './document-assignment.dto';
import { CustomerDocumentOverrideDto } from './customer-document-override.dto';
import { CustomerCustomDocumentDto } from './customer-custom-document.dto';
import { CustomerPipelineStepOverrideDto } from './customer-pipeline-step-override.dto';
import { CustomerCustomPipelineStepDto } from './customer-custom-pipeline-step.dto';
export declare class UpdateCustomerDto {
    name?: string;
    email?: string;
    phone?: string;
    property?: string;
    address?: string;
    profilePhoto?: string;
    documentAssignments?: DocumentAssignmentDto[];
    documentOverrides?: CustomerDocumentOverrideDto[];
    customDocuments?: CustomerCustomDocumentDto[];
    pipelineOverrides?: CustomerPipelineStepOverrideDto[];
    customPipelineSteps?: CustomerCustomPipelineStepDto[];
}
