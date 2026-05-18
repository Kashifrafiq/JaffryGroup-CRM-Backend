import { AssociateProfile } from './associate-profile.entity';
import { CustomerApplicationPipelineProgress } from '../../applications/entities/customer-application-pipeline-progress.entity';
export declare class AssociatePipelineStep {
    id: string;
    associateId: string;
    pipelineProgressId: string;
    associate: AssociateProfile;
    pipelineProgress: CustomerApplicationPipelineProgress;
}
