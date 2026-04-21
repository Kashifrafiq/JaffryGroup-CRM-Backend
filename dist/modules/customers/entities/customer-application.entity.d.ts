import { CustomerProfile } from '../../users/entities/customer-profile.entity';
import { ApplicationType } from '../../applications/entities/application-type.entity';
import { CustomerApplicationStatus } from './customer-application-status.enum';
export declare class CustomerApplication {
    id: string;
    customer: CustomerProfile;
    customerId: string;
    applicationType: ApplicationType;
    applicationTypeId: string;
    status: CustomerApplicationStatus;
    pipeline?: Record<string, unknown> | null;
    pipelineProgress?: import('../../applications/entities/customer-application-pipeline-progress.entity').CustomerApplicationPipelineProgress[];
    applicationDocuments?: import('../../applications/entities/customer-application-document.entity').CustomerApplicationDocument[];
    createdAt: Date;
    updatedAt: Date;
}
