import { CustomerProfile } from '../../users/entities/customer-profile.entity';
import { AssociateProfile } from '../../users/entities/associate-profile.entity';
import { CustomerReminderStatus } from './customer-reminder.enums';
export declare class CustomerReminder {
    id: string;
    customerId: string;
    customer: CustomerProfile;
    associateId?: string | null;
    associate?: AssociateProfile | null;
    title: string;
    description?: string | null;
    remindAt: Date;
    status: CustomerReminderStatus;
    createdByUserId: string;
    createdAt: Date;
    updatedAt: Date;
}
