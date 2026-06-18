import { CustomerApplicationStatus } from '../entities/customer-application-status.enum';
export declare class UpdateCustomerApplicationDto {
    applicationTypeId?: string;
    applicationTypeCode?: string;
    status?: CustomerApplicationStatus;
}
