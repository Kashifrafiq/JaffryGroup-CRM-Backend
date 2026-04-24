import { CustomerApplicationStatus } from '../entities/customer-application-status.enum';
export declare class CreateCustomerApiDto {
    name: string;
    email: string;
    phone: string;
    property: string;
    applicationTypeId?: string;
    applicationTypeCode?: string;
    status?: CustomerApplicationStatus;
    pipeline?: Record<string, unknown>;
    address?: string;
    profilePhoto?: string;
    associateId?: string;
}
