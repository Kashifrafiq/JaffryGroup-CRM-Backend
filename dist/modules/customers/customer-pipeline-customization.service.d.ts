import { Repository } from 'typeorm';
import { CustomerApplicationPipelineProgress } from '../applications/entities/customer-application-pipeline-progress.entity';
import { CustomerApplication } from './entities/customer-application.entity';
import { CustomerPipelineStepOverrideDto } from './dto/customer-pipeline-step-override.dto';
import { CustomerCustomPipelineStepDto } from './dto/customer-custom-pipeline-step.dto';
export declare class CustomerPipelineCustomizationService {
    private readonly pipelineProgressRepository;
    private readonly applicationRepository;
    constructor(pipelineProgressRepository: Repository<CustomerApplicationPipelineProgress>, applicationRepository: Repository<CustomerApplication>);
    applyOnCreate(customerId: string, overrides?: CustomerPipelineStepOverrideDto[], customPipelineSteps?: CustomerCustomPipelineStepDto[]): Promise<void>;
    applyOnUpdate(customerId: string, overrides?: CustomerPipelineStepOverrideDto[], customPipelineSteps?: CustomerCustomPipelineStepDto[]): Promise<void>;
    applySingleOverride(customerId: string, applicationId: string, pipelineProgressId: string, patch: Pick<CustomerPipelineStepOverrideDto, 'title' | 'removed'>): Promise<CustomerApplicationPipelineProgress>;
    addCustomPipelineStep(customerId: string, applicationId: string, dto: CustomerCustomPipelineStepDto): Promise<CustomerApplicationPipelineProgress>;
    private loadApplications;
    private applyOverrides;
    private resolveStepForOverride;
    private insertCustomPipelineSteps;
    private filterApps;
    private patchPipelineRow;
}
