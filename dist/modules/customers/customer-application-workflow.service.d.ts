import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { CustomerApplication } from './entities/customer-application.entity';
import { AssociateProfile } from '../users/entities/associate-profile.entity';
import { PipelineStepAssignmentService } from './pipeline-step-assignment.service';
import { DocumentAssignmentService } from './document-assignment.service';
import { CustomerProfile } from '../users/entities/customer-profile.entity';
import { UserRole } from '../users/entities/user-role.enum';
import { JwtActor } from './jwt-actor.type';
import { CustomerApplicationPipelineProgress } from '../applications/entities/customer-application-pipeline-progress.entity';
import { CustomerApplicationDocument } from '../applications/entities/customer-application-document.entity';
import { CustomerApplicationDocumentFile } from '../applications/entities/customer-application-document-file.entity';
import { S3StorageService } from '../applications/s3-storage.service';
import { PresignDocumentUploadDto } from './dto/presign-document-upload.dto';
import { CompleteDocumentUploadDto } from './dto/complete-document-upload.dto';
import { PatchApplicationDocumentDto } from './dto/patch-application-document.dto';
export declare class CustomerApplicationWorkflowService {
    private readonly applicationRepository;
    private readonly pipelineProgressRepository;
    private readonly applicationDocumentRepository;
    private readonly applicationDocumentFileRepository;
    private readonly associateProfileRepository;
    private readonly pipelineStepAssignmentService;
    private readonly documentAssignmentService;
    private readonly customerProfileRepository;
    private readonly userRepository;
    private readonly s3StorageService;
    constructor(applicationRepository: Repository<CustomerApplication>, pipelineProgressRepository: Repository<CustomerApplicationPipelineProgress>, applicationDocumentRepository: Repository<CustomerApplicationDocument>, applicationDocumentFileRepository: Repository<CustomerApplicationDocumentFile>, associateProfileRepository: Repository<AssociateProfile>, pipelineStepAssignmentService: PipelineStepAssignmentService, documentAssignmentService: DocumentAssignmentService, customerProfileRepository: Repository<CustomerProfile>, userRepository: Repository<User>, s3StorageService: S3StorageService);
    private tid;
    getWorkflow(customerId: string, applicationId: string, actor: JwtActor): Promise<{
        applicationId: string;
        applicationType: {
            id: string;
            code: string;
            name: string;
        };
        pipelineSteps: {
            id: string;
            stepIndex: number;
            title: string;
            isCustom: boolean;
            completedAt: Date | null;
            assignedTo: import("./pipeline-step-assignment.service").PipelineStepAssignee[];
        }[];
        documents: Record<string, unknown>[];
    }>;
    assignPipelineStepAssociates(customerId: string, applicationId: string, stepIndex: number, associateIds: string[]): Promise<{
        pipelineProgressId: string;
        assignedAssociateIds: string[];
        totalAssigned: number;
    }>;
    replacePipelineStepAssociates(customerId: string, applicationId: string, stepIndex: number, associateIds: string[]): Promise<{
        pipelineProgressId: string;
        assignedAssociateIds: string[];
        totalAssigned: number;
    }>;
    unassignPipelineStepAssociate(customerId: string, applicationId: string, stepIndex: number, associateId: string): Promise<{
        pipelineProgressId: string;
        associateId: string;
        removed: boolean;
    }>;
    patchPipelineStep(customerId: string, applicationId: string, stepIndex: number, completed: boolean, actor: JwtActor): Promise<{
        applicationId: string;
        applicationType: {
            id: string;
            code: string;
            name: string;
        };
        pipelineSteps: {
            id: string;
            stepIndex: number;
            title: string;
            isCustom: boolean;
            completedAt: Date | null;
            assignedTo: import("./pipeline-step-assignment.service").PipelineStepAssignee[];
        }[];
        documents: Record<string, unknown>[];
    }>;
    presignDocumentUpload(customerId: string, applicationId: string, documentId: string, dto: PresignDocumentUploadDto, actor: JwtActor): Promise<{
        uploadUrl: string;
        bucket: string;
        key: string;
        expiresIn: number;
        fileId: string;
    }>;
    presignDocumentUploadForCustomerUser(applicationId: string, documentId: string, dto: PresignDocumentUploadDto, actor: JwtActor): Promise<{
        uploadUrl: string;
        bucket: string;
        key: string;
        expiresIn: number;
        fileId: string;
    }>;
    completeDocumentUpload(customerId: string, applicationId: string, documentId: string, dto: CompleteDocumentUploadDto, actor: JwtActor): Promise<{
        applicationId: string;
        applicationType: {
            id: string;
            code: string;
            name: string;
        };
        pipelineSteps: {
            id: string;
            stepIndex: number;
            title: string;
            isCustom: boolean;
            completedAt: Date | null;
            assignedTo: import("./pipeline-step-assignment.service").PipelineStepAssignee[];
        }[];
        documents: Record<string, unknown>[];
    }>;
    completeDocumentUploadForCustomerUser(applicationId: string, documentId: string, dto: CompleteDocumentUploadDto, actor: JwtActor): Promise<{
        applicationId: string;
        applicationType: {
            id: string;
            code: string;
            name: string;
        };
        pipelineSteps: {
            id: string;
            stepIndex: number;
            title: string;
            isCustom: boolean;
            completedAt: Date | null;
            assignedTo: import("./pipeline-step-assignment.service").PipelineStepAssignee[];
        }[];
        documents: Record<string, unknown>[];
    }>;
    patchDocument(customerId: string, applicationId: string, documentId: string, dto: PatchApplicationDocumentDto, actor: JwtActor): Promise<{
        applicationId: string;
        applicationType: {
            id: string;
            code: string;
            name: string;
        };
        pipelineSteps: {
            id: string;
            stepIndex: number;
            title: string;
            isCustom: boolean;
            completedAt: Date | null;
            assignedTo: import("./pipeline-step-assignment.service").PipelineStepAssignee[];
        }[];
        documents: Record<string, unknown>[];
    }>;
    getDocumentReadUrl(customerId: string, applicationId: string, documentId: string, actor: JwtActor, fileId?: string): Promise<{
        readUrl: string;
        bucket: string;
        key: string;
        expiresIn: number;
    }>;
    getDocumentReadUrlForCustomerUser(applicationId: string, documentId: string, actor: JwtActor, fileId?: string): Promise<{
        readUrl: string;
        bucket: string;
        key: string;
        expiresIn: number;
    }>;
    deleteDocumentFile(customerId: string, applicationId: string, documentId: string, fileId: string, actor: JwtActor): Promise<{
        applicationId: string;
        applicationType: {
            id: string;
            code: string;
            name: string;
        };
        pipelineSteps: {
            id: string;
            stepIndex: number;
            title: string;
            isCustom: boolean;
            completedAt: Date | null;
            assignedTo: import("./pipeline-step-assignment.service").PipelineStepAssignee[];
        }[];
        documents: Record<string, unknown>[];
    }>;
    deleteDocumentFileForCustomerUser(applicationId: string, documentId: string, fileId: string, actor: JwtActor): Promise<{
        applicationId: string;
        applicationType: {
            id: string;
            code: string;
            name: string;
        };
        pipelineSteps: {
            id: string;
            stepIndex: number;
            title: string;
            isCustom: boolean;
            completedAt: Date | null;
            assignedTo: import("./pipeline-step-assignment.service").PipelineStepAssignee[];
        }[];
        documents: Record<string, unknown>[];
    }>;
    getCustomerWorkflow(customerId: string, applicationId: string, actor: JwtActor): Promise<{
        applicationId: string;
        applicationType: {
            id: string;
            code: string;
            name: string;
        };
        pipelineSteps: {
            id: string;
            stepIndex: number;
            title: string;
            isCustom: boolean;
            completedAt: Date | null;
            assignedTo: import("./pipeline-step-assignment.service").PipelineStepAssignee[];
        }[];
        documents: Record<string, unknown>[];
    }>;
    buildWorkflowPayload(app: CustomerApplication, customerUserId?: string, uploaderRoleByUserId?: Map<string, UserRole>, options?: {
        assignedDocumentIds?: string[] | null;
        assignedPipelineProgressIds?: string[] | null;
        includeDocumentAssignees?: boolean;
    }): Promise<{
        applicationId: string;
        applicationType: {
            id: string;
            code: string;
            name: string;
        };
        pipelineSteps: {
            id: string;
            stepIndex: number;
            title: string;
            isCustom: boolean;
            completedAt: Date | null;
            assignedTo: import("./pipeline-step-assignment.service").PipelineStepAssignee[];
        }[];
        documents: Record<string, unknown>[];
    }>;
    private loadApplication;
    private loadDocumentRow;
    private loadDocumentFileRow;
    private assertCanAccess;
    private assertCanAccessApplication;
    private assignedDocumentIdsForActor;
    private assignedPipelineProgressIdsForActor;
    private assertCanAccessDocument;
    private assertCanModifyPipelineStep;
    private uploaderRoleMapForDocuments;
    private assertDocumentIsActive;
    private assertPipelineStepIsActive;
    private assertCustomerCanUploadDocument;
    private assertCustomerCanPreviewDocument;
    private assertCustomerCanPreviewFile;
    private assertCustomerCanDeleteFile;
    private syncDocumentStatusAfterFileChange;
    private customerIdForUser;
}
