import { CustomerReminderStatus } from '../entities/customer-reminder.enums';
export declare class CreateCustomerReminderDto {
    title: string;
    description?: string;
    remindAt: string;
    status?: CustomerReminderStatus;
}
