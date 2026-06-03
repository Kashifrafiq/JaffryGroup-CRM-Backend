import { User } from '../users/entities/user.entity';
import { CustomerApplicationWorkflowService } from './customer-application-workflow.service';
import { PatchPipelineStepDto } from './dto/patch-pipeline-step.dto';
import { PresignDocumentUploadDto } from './dto/presign-document-upload.dto';
import { CompleteDocumentUploadDto } from './dto/complete-document-upload.dto';
import { PatchApplicationDocumentDto } from './dto/patch-application-document.dto';
import { AssignPipelineStepAssociatesDto } from './dto/assign-pipeline-step-associates.dto';
import { ReplacePipelineStepAssociatesDto } from './dto/replace-pipeline-step-associates.dto';
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
            assignedTo: import("./pipeline-step-assignment.service").PipelineStepAssignee[];
        }[];
        documents: Record<string, unknown>[];
    }>;
    assignPipelineStepAssociates(customerId: string, applicationId: string, stepIndex: number, dto: AssignPipelineStepAssociatesDto): Promise<{
        pipelineProgressId: string;
        assignedAssociateIds: string[];
        totalAssigned: number;
    }>;
    replacePipelineStepAssociates(customerId: string, applicationId: string, stepIndex: number, dto: ReplacePipelineStepAssociatesDto): Promise<{
        pipelineProgressId: string;
        assignedAssociateIds: string[];
        totalAssigned: number;
    }>;
    unassignPipelineStepAssociate(customerId: string, applicationId: string, stepIndex: number, associateId: string): Promise<{
        pipelineProgressId: string;
        associateId: string;
        removed: boolean;
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
            assignedTo: import("./pipeline-step-assignment.service").PipelineStepAssignee[];
        }[];
        documents: Record<string, unknown>[];
    }>;
    presignUploadForMe(applicationId: string, documentId: string, dto: PresignDocumentUploadDto, req: RequestWithJwtUser): Promise<{
        uploadUrl: string;
        bucket: string;
        key: string;
        expiresIn: number;
    }>;
    presignUpload(customerId: string, applicationId: string, documentId: string, dto: PresignDocumentUploadDto, req: RequestWithJwtUser): Promise<{
        uploadUrl: string;
        bucket: string;
        key: string;
        expiresIn: number;
    }>;
    getDocumentReadUrlForMe(applicationId: string, documentId: string, req: RequestWithJwtUser): Promise<{
        readUrl: string;
        bucket: string;
        key: string;
        expiresIn: number;
    }>;
    completeUploadForMe(applicationId: string, documentId: string, dto: CompleteDocumentUploadDto, req: RequestWithJwtUser): Promise<{
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
            assignedTo: import("./pipeline-step-assignment.service").PipelineStepAssignee[];
        }[];
        documents: Record<string, unknown>[];
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
            assignedTo: import("./pipeline-step-assignment.service").PipelineStepAssignee[];
        }[];
        documents: Record<string, unknown>[];
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
            assignedTo: import("./pipeline-step-assignment.service").PipelineStepAssignee[];
        }[];
        documents: Record<string, unknown>[];
    }>;
    getDocumentReadUrl(customerId: string, applicationId: string, documentId: string, req: RequestWithJwtUser): Promise<{
        readUrl: string;
        bucket: string;
        key: string;
        expiresIn: number;
    }>;
}
export {};
