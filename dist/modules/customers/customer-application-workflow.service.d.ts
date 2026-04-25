import { Repository } from 'typeorm';
import { CustomerApplication } from './entities/customer-application.entity';
import { AssociateCustomer } from '../users/entities/associate-customer.entity';
import { AssociateProfile } from '../users/entities/associate-profile.entity';
import { CustomerProfile } from '../users/entities/customer-profile.entity';
import { JwtActor } from './jwt-actor.type';
import { CustomerApplicationPipelineProgress } from '../applications/entities/customer-application-pipeline-progress.entity';
import { CustomerApplicationDocument } from '../applications/entities/customer-application-document.entity';
import { CustomerApplicationDocumentStatus } from '../applications/entities/customer-application-document-status.enum';
import { S3StorageService } from '../applications/s3-storage.service';
import { PresignDocumentUploadDto } from './dto/presign-document-upload.dto';
import { CompleteDocumentUploadDto } from './dto/complete-document-upload.dto';
import { PatchApplicationDocumentDto } from './dto/patch-application-document.dto';
export declare class CustomerApplicationWorkflowService {
    private readonly applicationRepository;
    private readonly pipelineProgressRepository;
    private readonly applicationDocumentRepository;
    private readonly associateCustomerRepository;
    private readonly associateProfileRepository;
    private readonly customerProfileRepository;
    private readonly s3StorageService;
    constructor(applicationRepository: Repository<CustomerApplication>, pipelineProgressRepository: Repository<CustomerApplicationPipelineProgress>, applicationDocumentRepository: Repository<CustomerApplicationDocument>, associateCustomerRepository: Repository<AssociateCustomer>, associateProfileRepository: Repository<AssociateProfile>, customerProfileRepository: Repository<CustomerProfile>, s3StorageService: S3StorageService);
    private tid;
    getWorkflow(customerId: string, applicationId: string, actor: JwtActor): Promise<{
        applicationId: string;
        applicationType: {
            id: string;
            code: string;
            name: string;
        };
        pipelineSteps: {
            stepIndex: number;
            title: string;
            completedAt: Date | null;
        }[];
        documents: {
            id: string;
            status: CustomerApplicationDocumentStatus;
            requirementKey: string;
            sectionTitle: string;
            itemLabel: string;
            sortOrder: number;
            storageKey: string | null;
            bucket: string | null;
            originalFilename: string | null;
            mimeType: string | null;
            sizeBytes: string | null;
            uploadedAt: Date | null;
            uploadedByUserId: string | null;
            notes: string | null;
        }[];
    }>;
    patchPipelineStep(customerId: string, applicationId: string, stepIndex: number, completed: boolean, actor: JwtActor): Promise<{
        applicationId: string;
        applicationType: {
            id: string;
            code: string;
            name: string;
        };
        pipelineSteps: {
            stepIndex: number;
            title: string;
            completedAt: Date | null;
        }[];
        documents: {
            id: string;
            status: CustomerApplicationDocumentStatus;
            requirementKey: string;
            sectionTitle: string;
            itemLabel: string;
            sortOrder: number;
            storageKey: string | null;
            bucket: string | null;
            originalFilename: string | null;
            mimeType: string | null;
            sizeBytes: string | null;
            uploadedAt: Date | null;
            uploadedByUserId: string | null;
            notes: string | null;
        }[];
    }>;
    presignDocumentUpload(customerId: string, applicationId: string, documentId: string, dto: PresignDocumentUploadDto, actor: JwtActor): Promise<{
        uploadUrl: string;
        bucket: string;
        key: string;
        expiresIn: number;
    }>;
    completeDocumentUpload(customerId: string, applicationId: string, documentId: string, dto: CompleteDocumentUploadDto, actor: JwtActor): Promise<{
        applicationId: string;
        applicationType: {
            id: string;
            code: string;
            name: string;
        };
        pipelineSteps: {
            stepIndex: number;
            title: string;
            completedAt: Date | null;
        }[];
        documents: {
            id: string;
            status: CustomerApplicationDocumentStatus;
            requirementKey: string;
            sectionTitle: string;
            itemLabel: string;
            sortOrder: number;
            storageKey: string | null;
            bucket: string | null;
            originalFilename: string | null;
            mimeType: string | null;
            sizeBytes: string | null;
            uploadedAt: Date | null;
            uploadedByUserId: string | null;
            notes: string | null;
        }[];
    }>;
    patchDocument(customerId: string, applicationId: string, documentId: string, dto: PatchApplicationDocumentDto, actor: JwtActor): Promise<{
        applicationId: string;
        applicationType: {
            id: string;
            code: string;
            name: string;
        };
        pipelineSteps: {
            stepIndex: number;
            title: string;
            completedAt: Date | null;
        }[];
        documents: {
            id: string;
            status: CustomerApplicationDocumentStatus;
            requirementKey: string;
            sectionTitle: string;
            itemLabel: string;
            sortOrder: number;
            storageKey: string | null;
            bucket: string | null;
            originalFilename: string | null;
            mimeType: string | null;
            sizeBytes: string | null;
            uploadedAt: Date | null;
            uploadedByUserId: string | null;
            notes: string | null;
        }[];
    }>;
    getDocumentReadUrl(customerId: string, applicationId: string, documentId: string, actor: JwtActor): Promise<{
        readUrl: string;
        bucket: string;
        key: string;
        expiresIn: number;
    }>;
    buildWorkflowPayload(app: CustomerApplication): {
        applicationId: string;
        applicationType: {
            id: string;
            code: string;
            name: string;
        };
        pipelineSteps: {
            stepIndex: number;
            title: string;
            completedAt: Date | null;
        }[];
        documents: {
            id: string;
            status: CustomerApplicationDocumentStatus;
            requirementKey: string;
            sectionTitle: string;
            itemLabel: string;
            sortOrder: number;
            storageKey: string | null;
            bucket: string | null;
            originalFilename: string | null;
            mimeType: string | null;
            sizeBytes: string | null;
            uploadedAt: Date | null;
            uploadedByUserId: string | null;
            notes: string | null;
        }[];
    };
    private loadApplication;
    private loadDocumentRow;
    private assertCanAccess;
}
