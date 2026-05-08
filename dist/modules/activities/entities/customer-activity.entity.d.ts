import { CustomerProfile } from '../../users/entities/customer-profile.entity';
import { AssociateProfile } from '../../users/entities/associate-profile.entity';
export declare class CustomerActivity {
    id: string;
    customerId: string;
    customer: CustomerProfile;
    associateId?: string | null;
    associate?: AssociateProfile | null;
    activityType: string;
    details: string;
    createdByUserId: string;
    createdAt: Date;
    updatedAt: Date;
}
