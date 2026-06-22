import { ApplicationPipelineStepTemplate } from './application-pipeline-step-template.entity';
export declare class CustomerApplicationPipelineProgress {
    id: string;
    customerApplicationId: string;
    customerApplication: unknown;
    pipelineStepTemplateId?: string | null;
    pipelineStepTemplate?: ApplicationPipelineStepTemplate | null;
    stepIndex: number;
    title: string;
    isCustom: boolean;
    isActive: boolean;
    completedAt?: Date | null;
    createdAt: Date;
    updatedAt: Date;
}
