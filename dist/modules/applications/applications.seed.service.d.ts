import { OnApplicationBootstrap } from '@nestjs/common';
import { Repository } from 'typeorm';
import { ApplicationType } from './entities/application-type.entity';
import { ApplicationWorkflowTemplatesSeedService } from './application-workflow-templates.seed.service';
export declare class ApplicationsSeedService implements OnApplicationBootstrap {
    private readonly applicationTypeRepository;
    private readonly workflowTemplatesSeed;
    private readonly logger;
    constructor(applicationTypeRepository: Repository<ApplicationType>, workflowTemplatesSeed: ApplicationWorkflowTemplatesSeedService);
    onApplicationBootstrap(): Promise<void>;
}
