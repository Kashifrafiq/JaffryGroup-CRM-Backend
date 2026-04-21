import { User } from '../users/entities/user.entity';
import { CustomerApplicationWorkflowService } from './customer-application-workflow.service';
import { PatchPipelineStepDto } from './dto/patch-pipeline-step.dto';
import { PresignDocumentUploadDto } from './dto/presign-document-upload.dto';
import { CompleteDocumentUploadDto } from './dto/complete-document-upload.dto';
import { PatchApplicationDocumentDto } from './dto/patch-application-document.dto';
type RequestWithJwtUser = {
    user: Pick<User, 'id' | 'email' | 'role'>;
};
export declare class CustomerApplicationWorkflowController {
    private readonly workflowService;
    constructor(workflowService: CustomerApplicationWorkflowService);
    private actor;
    getWorkflow(customerId: string, applicationId: string, req: RequestWithJwtUser): Promise<{
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
            status: import("../applications/entities/customer-application-document-status.enum").CustomerApplicationDocumentStatus;
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
    patchPipelineStep(customerId: string, applicationId: string, stepIndex: number, dto: PatchPipelineStepDto, req: RequestWithJwtUser): Promise<{
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
            status: import("../applications/entities/customer-application-document-status.enum").CustomerApplicationDocumentStatus;
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
    presignUpload(customerId: string, applicationId: string, documentId: string, dto: PresignDocumentUploadDto, req: RequestWithJwtUser): Promise<{
        uploadUrl: string;
        bucket: string;
        key: string;
        expiresIn: number;
    }>;
    completeUpload(customerId: string, applicationId: string, documentId: string, dto: CompleteDocumentUploadDto, req: RequestWithJwtUser): Promise<{
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
            status: import("../applications/entities/customer-application-document-status.enum").CustomerApplicationDocumentStatus;
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
    patchDocument(customerId: string, applicationId: string, documentId: string, dto: PatchApplicationDocumentDto, req: RequestWithJwtUser): Promise<{
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
            status: import("../applications/entities/customer-application-document-status.enum").CustomerApplicationDocumentStatus;
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
}
export {};
