import { CustomerApplicationStatus } from '../entities/customer-application-status.enum';
import { DocumentAssignmentOnCreateDto } from './document-assignment-on-create.dto';
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
}
