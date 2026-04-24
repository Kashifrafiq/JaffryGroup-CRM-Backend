import { Repository } from 'typeorm';
import { ApplicationType } from './entities/application-type.entity';
import { ApplicationPipelineStepTemplate } from './entities/application-pipeline-step-template.entity';
import { ApplicationDocumentRequirement } from './entities/application-document-requirement.entity';
import { CustomerApplicationDocument } from './entities/customer-application-document.entity';
export declare class ApplicationWorkflowTemplatesSeedService {
    private readonly applicationTypeRepository;
    private readonly pipelineTemplateRepository;
    private readonly documentRequirementRepository;
    private readonly customerApplicationDocumentRepository;
    private readonly logger;
    constructor(applicationTypeRepository: Repository<ApplicationType>, pipelineTemplateRepository: Repository<ApplicationPipelineStepTemplate>, documentRequirementRepository: Repository<ApplicationDocumentRequirement>, customerApplicationDocumentRepository: Repository<CustomerApplicationDocument>);
    seedTemplates(): Promise<void>;
    private syncPipelineTemplates;
    private syncDocumentTemplates;
    private getRequirementReferenceCounts;
}
