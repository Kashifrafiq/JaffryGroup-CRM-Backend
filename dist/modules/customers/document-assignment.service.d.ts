import { Repository } from 'typeorm';
import { AssociateCustomerApplicationDocument } from '../users/entities/associate-customer-application-document.entity';
import { AssociateProfile } from '../users/entities/associate-profile.entity';
import { CustomerApplicationDocument } from '../applications/entities/customer-application-document.entity';
import { CustomerApplication } from './entities/customer-application.entity';
import { DocumentAssignmentOnCreateDto } from './dto/document-assignment-on-create.dto';
import { DocumentAssignmentDto } from './dto/document-assignment.dto';
export type DocumentAssignee = {
    id: string;
    name: string;
};
export declare class DocumentAssignmentService {
    private readonly assignmentRepository;
    private readonly associateProfileRepository;
    private readonly documentRepository;
    private readonly applicationRepository;
    constructor(assignmentRepository: Repository<AssociateCustomerApplicationDocument>, associateProfileRepository: Repository<AssociateProfile>, documentRepository: Repository<CustomerApplicationDocument>, applicationRepository: Repository<CustomerApplication>);
    replaceAssociatesOnDocument(documentId: string, associateIds: string[]): Promise<{
        documentId: string;
        assignedAssociateIds: string[];
        totalAssigned: number;
    }>;
    assignAssociatesToDocument(documentId: string, associateIds: string[]): Promise<{
        documentId: string;
        assignedAssociateIds: string[];
        totalAssigned: number;
    }>;
    applyAssignmentsOnCreate(customerId: string, assignments: DocumentAssignmentOnCreateDto[]): Promise<void>;
    applyAssignmentsOnUpdate(customerId: string, assignments: DocumentAssignmentDto[]): Promise<void>;
    getCustomerIdsForAssociate(associateId: string): Promise<string[]>;
    hasAccessToCustomer(associateId: string, customerId: string): Promise<boolean>;
    hasAccessToDocument(associateId: string, documentId: string): Promise<boolean>;
    hasAccessToApplication(associateId: string, customerApplicationId: string): Promise<boolean>;
    getAssignedDocumentIdsForAssociate(associateId: string, customerId?: string): Promise<string[]>;
    getAssigneesByDocumentIds(documentIds: string[]): Promise<Map<string, DocumentAssignee[]>>;
}
