import { Repository } from 'typeorm';
import { ApplicationType } from './entities/application-type.entity';
import { ApplicationPipelineStepTemplate } from './entities/application-pipeline-step-template.entity';
import { ApplicationDocumentRequirement } from './entities/application-document-requirement.entity';
export declare class ApplicationTypesService {
    private readonly applicationTypeRepository;
    private readonly pipelineTemplateRepository;
    private readonly documentRequirementRepository;
    constructor(applicationTypeRepository: Repository<ApplicationType>, pipelineTemplateRepository: Repository<ApplicationPipelineStepTemplate>, documentRequirementRepository: Repository<ApplicationDocumentRequirement>);
    findActive(): Promise<ApplicationType[]>;
    findActiveById(id: string): Promise<ApplicationType>;
    findActiveByCode(code: string): Promise<ApplicationType | null>;
    findActiveByNameIgnoreCase(name: string): Promise<ApplicationType | null>;
    getWorkflowTemplate(applicationTypeId: string): Promise<{
        applicationType: {
            id: string;
            code: string;
            name: string;
        };
        pipelineSteps: {
            stepIndex: number;
            title: string;
        }[];
        documents: {
            id: string;
            requirementKey: string;
            sectionTitle: string;
            itemLabel: string;
            sortOrder: number;
        }[];
    }>;
}
