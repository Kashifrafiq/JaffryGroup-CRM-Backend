import { ApplicationType } from './application-type.entity';
export declare class ApplicationPipelineStepTemplate {
    id: string;
    applicationTypeId: string;
    applicationType: ApplicationType;
    stepIndex: number;
    title: string;
}
