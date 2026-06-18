import { AssociateProfile } from './associate-profile.entity';
import { CustomerApplicationDocument } from '../../applications/entities/customer-application-document.entity';
export declare class AssociateCustomerApplicationDocument {
    id: string;
    associateId: string;
    customerApplicationDocumentId: string;
    associate: AssociateProfile;
    customerApplicationDocument: CustomerApplicationDocument;
}
