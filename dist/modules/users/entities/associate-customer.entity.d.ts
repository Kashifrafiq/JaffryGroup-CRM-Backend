import { AssociateProfile } from './associate-profile.entity';
import { CustomerProfile } from './customer-profile.entity';
export declare class AssociateCustomer {
    id: string;
    associateId: string;
    customerId: string;
    associate: AssociateProfile;
    customer: CustomerProfile;
}
