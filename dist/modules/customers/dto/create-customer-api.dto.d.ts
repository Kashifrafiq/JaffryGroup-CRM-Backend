import { CustomerApplicationStatus } from '../entities/customer-application-status.enum';
import { DocumentAssignmentOnCreateDto } from './document-assignment-on-create.dto';
import { CustomerDocumentOverrideDto } from './customer-document-override.dto';
import { CustomerCustomDocumentDto } from './customer-custom-document.dto';
import { CustomerPipelineStepOverrideDto } from './customer-pipeline-step-override.dto';
import { CustomerCustomPipelineStepDto } from './customer-custom-pipeline-step.dto';
export declare class CreateCustomerApiDto {
    name: string;
    email: string;
    phone: string;
    property: string;
    applicationTypeId?: string;
    applicationTypeCode?: string;
    applicationTypeIds?: string[];
    applicationTypeCodes?: string[];
    status?: CustomerApplicationStatus;
    address?: string;
    profilePhoto?: string;
    associateId?: string;
    documentAssignments?: DocumentAssignmentOnCreateDto[];
    documentOverrides?: CustomerDocumentOverrideDto[];
    customDocuments?: CustomerCustomDocumentDto[];
    pipelineOverrides?: CustomerPipelineStepOverrideDto[];
    customPipelineSteps?: CustomerCustomPipelineStepDto[];
}
