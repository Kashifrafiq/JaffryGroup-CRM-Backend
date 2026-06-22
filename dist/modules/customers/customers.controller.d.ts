import { User } from '../users/entities/user.entity';
import { CustomersService } from './customers.service';
import { CreateCustomerApiDto } from './dto/create-customer-api.dto';
import { InviteCustomerDto } from './dto/invite-customer.dto';
import { ListCustomersQueryDto } from './dto/list-customers-query.dto';
import { ListCustomerDocumentsQueryDto } from './dto/list-customer-documents-query.dto';
import { ListCustomerPipelineStepsQueryDto } from './dto/list-customer-pipeline-steps-query.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { CreateCustomerApplicationDto } from './dto/create-customer-application.dto';
import { UpdateCustomerApplicationDto } from './dto/update-customer-application.dto';
import { PatchCustomerDocumentDisplayDto } from './dto/patch-customer-document-display.dto';
import { CustomerCustomDocumentDto } from './dto/customer-custom-document.dto';
import { PatchCustomerPipelineStepDisplayDto } from './dto/patch-customer-pipeline-step-display.dto';
import { CustomerCustomPipelineStepDto } from './dto/customer-custom-pipeline-step.dto';
type RequestWithJwtUser = {
    user: Pick<User, 'id' | 'email' | 'role'>;
};
export declare class CustomersController {
    private readonly customersService;
    constructor(customersService: CustomersService);
    private actor;
    create(dto: CreateCustomerApiDto, req: RequestWithJwtUser): Promise<{
        id: string;
        profilePhoto: string | null;
        name: string;
        email: string;
        phone: string | null;
        property: string | null;
        address: string | null;
        applications: {
            applicationId: string;
            applicationType: {
                id: string;
                name: string;
            } | null;
            progress: {
                completedSteps: number;
                totalSteps: number;
            };
            pipelineSteps: {
                id: string;
                stepIndex: number;
                title: string;
                isCustom: boolean;
                completedAt: Date | null;
                assignedTo: import("./pipeline-step-assignment.service").PipelineStepAssignee[];
            }[];
            assignedTo: import("./pipeline-step-assignment.service").PipelineStepAssignee[];
            documents: {
                id: string;
                requirementKey: string;
                sectionTitle: string;
                itemLabel: string;
                sortOrder: number;
                isCustom: boolean;
                status: import("../applications/entities/customer-application-document-status.enum").CustomerApplicationDocumentStatus;
                storageKey: string | null;
                bucket: string | null;
                originalFilename: string | null;
                mimeType: string | null;
                uploadedAt: Date | null;
                assignedTo: import("./document-assignment.service").DocumentAssignee[];
                files: {
                    id: string;
                    storageKey: string | null;
                    bucket: string | null;
                    originalFilename: string | null;
                    mimeType: string | null;
                    sizeBytes: string | null;
                    uploadedAt: Date | null;
                    uploadedByUserId: string | null;
                }[];
            }[] | undefined;
        }[];
    }>;
    invite(dto: InviteCustomerDto, req: RequestWithJwtUser): Promise<{
        inviteSent: true;
        email: string;
        expiresAt: Date;
    }>;
    findAll(query: ListCustomersQueryDto, req: RequestWithJwtUser): Promise<{
        id: string;
        profilePhoto: string | null;
        name: string;
        email: string;
        phone: string | null;
        property: string | null;
        address: string | null;
        applications: {
            applicationId: string;
            applicationType: {
                id: string;
                name: string;
            } | null;
            progress: {
                completedSteps: number;
                totalSteps: number;
            };
            pipelineSteps: {
                id: string;
                stepIndex: number;
                title: string;
                isCustom: boolean;
                completedAt: Date | null;
                assignedTo: import("./pipeline-step-assignment.service").PipelineStepAssignee[];
            }[];
            assignedTo: import("./pipeline-step-assignment.service").PipelineStepAssignee[];
            documents: {
                id: string;
                requirementKey: string;
                sectionTitle: string;
                itemLabel: string;
                sortOrder: number;
                isCustom: boolean;
                status: import("../applications/entities/customer-application-document-status.enum").CustomerApplicationDocumentStatus;
                storageKey: string | null;
                bucket: string | null;
                originalFilename: string | null;
                mimeType: string | null;
                uploadedAt: Date | null;
                assignedTo: import("./document-assignment.service").DocumentAssignee[];
                files: {
                    id: string;
                    storageKey: string | null;
                    bucket: string | null;
                    originalFilename: string | null;
                    mimeType: string | null;
                    sizeBytes: string | null;
                    uploadedAt: Date | null;
                    uploadedByUserId: string | null;
                }[];
            }[] | undefined;
        }[];
    }[]>;
    me(req: RequestWithJwtUser): Promise<{
        id: string;
        name: string;
        email: string;
        applications: Array<{
            applicationId: string;
            applicationType: {
                id: string;
                name: string;
            } | null;
        }>;
    }>;
    myPipeline(req: RequestWithJwtUser): Promise<{
        customerId: string;
        applications: Array<{
            applicationId: string;
            applicationType: {
                id: string;
                name: string;
            } | null;
            pipelineSteps: Array<{
                stepIndex: number;
                title: string;
                completed: boolean;
                completedAt: Date | null;
            }>;
        }>;
    }>;
    myDocuments(req: RequestWithJwtUser): Promise<{
        customerId: string;
        applications: Array<{
            applicationId: string;
            applicationType: {
                id: string;
                name: string;
            } | null;
            summary: {
                uploaded: number;
                remaining: number;
                total: number;
            };
            documents: Array<{
                id: string;
                requirementKey: string;
                sectionTitle: string;
                itemLabel: string;
                status: string;
                uploaded: boolean;
                uploadedByMe: boolean;
                uploadedAt: Date | null;
                canPreview: boolean;
                originalFilename: string | null;
                fileCount: number;
                files: Array<{
                    id: string;
                    originalFilename: string | null;
                    uploadedAt: Date | null;
                    uploadedByMe: boolean;
                    canPreview: boolean;
                }>;
            }>;
        }>;
    }>;
    findPipelineSteps(customerId: string, query: ListCustomerPipelineStepsQueryDto, req: RequestWithJwtUser): Promise<{
        customerId: string;
        customerName: string;
        associateId: string;
        associateName: string;
        applications: Array<{
            applicationId: string;
            applicationType: {
                id: string;
                code: string;
                name: string;
            } | null;
            summary: {
                completedSteps: number;
                totalSteps: number;
            };
            pipelineSteps: Array<{
                stepIndex: number;
                title: string;
                completedAt: Date | null;
                assignedTo: import("./pipeline-step-assignment.service").PipelineStepAssignee[];
            }>;
        }>;
    }>;
    customizeDocument(customerId: string, applicationId: string, documentId: string, dto: PatchCustomerDocumentDisplayDto, req: RequestWithJwtUser): Promise<import("../applications/entities/customer-application-document.entity").CustomerApplicationDocument>;
    addCustomDocument(customerId: string, applicationId: string, dto: CustomerCustomDocumentDto, req: RequestWithJwtUser): Promise<import("../applications/entities/customer-application-document.entity").CustomerApplicationDocument>;
    customizePipelineStep(customerId: string, applicationId: string, pipelineProgressId: string, dto: PatchCustomerPipelineStepDisplayDto, req: RequestWithJwtUser): Promise<import("../applications/entities/customer-application-pipeline-progress.entity").CustomerApplicationPipelineProgress>;
    addCustomPipelineStep(customerId: string, applicationId: string, dto: CustomerCustomPipelineStepDto, req: RequestWithJwtUser): Promise<import("../applications/entities/customer-application-pipeline-progress.entity").CustomerApplicationPipelineProgress>;
    findDocuments(customerId: string, query: ListCustomerDocumentsQueryDto, req: RequestWithJwtUser): Promise<{
        customerId: string;
        customerName: string;
        associateId: string;
        associateName: string;
        applications: Array<{
            applicationId: string;
            applicationType: {
                id: string;
                code: string;
                name: string;
            } | null;
            summary: {
                uploaded: number;
                remaining: number;
                total: number;
            };
            documents: Array<{
                id: string;
                requirementKey: string;
                sectionTitle: string;
                itemLabel: string;
                sortOrder: number;
                status: string;
                uploaded: boolean;
                fileCount: number;
                storageKey: string | null;
                bucket: string | null;
                originalFilename: string | null;
                mimeType: string | null;
                sizeBytes: string | null;
                uploadedAt: Date | null;
                uploadedByUserId: string | null;
                notes: string | null;
                assignedTo: import("./document-assignment.service").DocumentAssignee[];
                files: Array<{
                    id: string;
                    storageKey: string | null;
                    bucket: string | null;
                    originalFilename: string | null;
                    mimeType: string | null;
                    sizeBytes: string | null;
                    uploadedAt: Date | null;
                    uploadedByUserId: string | null;
                }>;
            }>;
        }>;
    }>;
    findOne(customerId: string, req: RequestWithJwtUser): Promise<{
        id: string;
        profilePhoto: string | null;
        name: string;
        email: string;
        phone: string | null;
        property: string | null;
        address: string | null;
        applications: {
            applicationId: string;
            applicationType: {
                id: string;
                name: string;
            } | null;
            progress: {
                completedSteps: number;
                totalSteps: number;
            };
            pipelineSteps: {
                id: string;
                stepIndex: number;
                title: string;
                isCustom: boolean;
                completedAt: Date | null;
                assignedTo: import("./pipeline-step-assignment.service").PipelineStepAssignee[];
            }[];
            assignedTo: import("./pipeline-step-assignment.service").PipelineStepAssignee[];
            documents: {
                id: string;
                requirementKey: string;
                sectionTitle: string;
                itemLabel: string;
                sortOrder: number;
                isCustom: boolean;
                status: import("../applications/entities/customer-application-document-status.enum").CustomerApplicationDocumentStatus;
                storageKey: string | null;
                bucket: string | null;
                originalFilename: string | null;
                mimeType: string | null;
                uploadedAt: Date | null;
                assignedTo: import("./document-assignment.service").DocumentAssignee[];
                files: {
                    id: string;
                    storageKey: string | null;
                    bucket: string | null;
                    originalFilename: string | null;
                    mimeType: string | null;
                    sizeBytes: string | null;
                    uploadedAt: Date | null;
                    uploadedByUserId: string | null;
                }[];
            }[] | undefined;
        }[];
    }>;
    update(customerId: string, dto: UpdateCustomerDto, req: RequestWithJwtUser): Promise<{
        id: string;
        profilePhoto: string | null;
        name: string;
        email: string;
        phone: string | null;
        property: string | null;
        address: string | null;
        applications: {
            applicationId: string;
            applicationType: {
                id: string;
                name: string;
            } | null;
            progress: {
                completedSteps: number;
                totalSteps: number;
            };
            pipelineSteps: {
                id: string;
                stepIndex: number;
                title: string;
                isCustom: boolean;
                completedAt: Date | null;
                assignedTo: import("./pipeline-step-assignment.service").PipelineStepAssignee[];
            }[];
            assignedTo: import("./pipeline-step-assignment.service").PipelineStepAssignee[];
            documents: {
                id: string;
                requirementKey: string;
                sectionTitle: string;
                itemLabel: string;
                sortOrder: number;
                isCustom: boolean;
                status: import("../applications/entities/customer-application-document-status.enum").CustomerApplicationDocumentStatus;
                storageKey: string | null;
                bucket: string | null;
                originalFilename: string | null;
                mimeType: string | null;
                uploadedAt: Date | null;
                assignedTo: import("./document-assignment.service").DocumentAssignee[];
                files: {
                    id: string;
                    storageKey: string | null;
                    bucket: string | null;
                    originalFilename: string | null;
                    mimeType: string | null;
                    sizeBytes: string | null;
                    uploadedAt: Date | null;
                    uploadedByUserId: string | null;
                }[];
            }[] | undefined;
        }[];
    }>;
    remove(customerId: string, req: RequestWithJwtUser): Promise<void>;
    addApplication(customerId: string, dto: CreateCustomerApplicationDto, req: RequestWithJwtUser): Promise<{
        id: string;
        profilePhoto: string | null;
        name: string;
        email: string;
        phone: string | null;
        property: string | null;
        address: string | null;
        applications: {
            applicationId: string;
            applicationType: {
                id: string;
                name: string;
            } | null;
            progress: {
                completedSteps: number;
                totalSteps: number;
            };
            pipelineSteps: {
                id: string;
                stepIndex: number;
                title: string;
                isCustom: boolean;
                completedAt: Date | null;
                assignedTo: import("./pipeline-step-assignment.service").PipelineStepAssignee[];
            }[];
            assignedTo: import("./pipeline-step-assignment.service").PipelineStepAssignee[];
            documents: {
                id: string;
                requirementKey: string;
                sectionTitle: string;
                itemLabel: string;
                sortOrder: number;
                isCustom: boolean;
                status: import("../applications/entities/customer-application-document-status.enum").CustomerApplicationDocumentStatus;
                storageKey: string | null;
                bucket: string | null;
                originalFilename: string | null;
                mimeType: string | null;
                uploadedAt: Date | null;
                assignedTo: import("./document-assignment.service").DocumentAssignee[];
                files: {
                    id: string;
                    storageKey: string | null;
                    bucket: string | null;
                    originalFilename: string | null;
                    mimeType: string | null;
                    sizeBytes: string | null;
                    uploadedAt: Date | null;
                    uploadedByUserId: string | null;
                }[];
            }[] | undefined;
        }[];
    }>;
    updateApplication(customerId: string, applicationId: string, dto: UpdateCustomerApplicationDto, req: RequestWithJwtUser): Promise<{
        id: string;
        profilePhoto: string | null;
        name: string;
        email: string;
        phone: string | null;
        property: string | null;
        address: string | null;
        applications: {
            applicationId: string;
            applicationType: {
                id: string;
                name: string;
            } | null;
            progress: {
                completedSteps: number;
                totalSteps: number;
            };
            pipelineSteps: {
                id: string;
                stepIndex: number;
                title: string;
                isCustom: boolean;
                completedAt: Date | null;
                assignedTo: import("./pipeline-step-assignment.service").PipelineStepAssignee[];
            }[];
            assignedTo: import("./pipeline-step-assignment.service").PipelineStepAssignee[];
            documents: {
                id: string;
                requirementKey: string;
                sectionTitle: string;
                itemLabel: string;
                sortOrder: number;
                isCustom: boolean;
                status: import("../applications/entities/customer-application-document-status.enum").CustomerApplicationDocumentStatus;
                storageKey: string | null;
                bucket: string | null;
                originalFilename: string | null;
                mimeType: string | null;
                uploadedAt: Date | null;
                assignedTo: import("./document-assignment.service").DocumentAssignee[];
                files: {
                    id: string;
                    storageKey: string | null;
                    bucket: string | null;
                    originalFilename: string | null;
                    mimeType: string | null;
                    sizeBytes: string | null;
                    uploadedAt: Date | null;
                    uploadedByUserId: string | null;
                }[];
            }[] | undefined;
        }[];
    }>;
    removeApplication(customerId: string, applicationId: string, req: RequestWithJwtUser): Promise<void>;
}
export {};
