import { CustomerApplicationStatus } from '../entities/customer-application-status.enum';
export declare class CreateCustomerApplicationDto {
    applicationTypeId?: string;
    applicationTypeCode?: string;
    status?: CustomerApplicationStatus;
    pipeline?: Record<string, unknown>;
}
