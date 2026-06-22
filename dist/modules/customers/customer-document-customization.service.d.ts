import { Repository } from 'typeorm';
import { CustomerApplicationDocument } from '../applications/entities/customer-application-document.entity';
import { CustomerApplication } from './entities/customer-application.entity';
import { CustomerDocumentOverrideDto } from './dto/customer-document-override.dto';
import { CustomerCustomDocumentDto } from './dto/customer-custom-document.dto';
export declare class CustomerDocumentCustomizationService {
    private readonly documentRepository;
    private readonly applicationRepository;
    constructor(documentRepository: Repository<CustomerApplicationDocument>, applicationRepository: Repository<CustomerApplication>);
    applyOnCreate(customerId: string, overrides?: CustomerDocumentOverrideDto[], customDocuments?: CustomerCustomDocumentDto[]): Promise<void>;
    applyOnUpdate(customerId: string, overrides?: CustomerDocumentOverrideDto[], customDocuments?: CustomerCustomDocumentDto[]): Promise<void>;
    applySingleOverride(customerId: string, applicationId: string, documentId: string, patch: Pick<CustomerDocumentOverrideDto, 'itemLabel' | 'sectionTitle' | 'sortOrder' | 'removed'>): Promise<CustomerApplicationDocument>;
    addCustomDocument(customerId: string, applicationId: string, dto: CustomerCustomDocumentDto): Promise<CustomerApplicationDocument>;
    private loadApplications;
    private applyOverrides;
    private resolveDocumentForOverride;
    private insertCustomDocuments;
    private filterApps;
    private patchDocumentRow;
}
