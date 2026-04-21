import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApplicationType } from './entities/application-type.entity';
import { ApplicationPipelineStepTemplate } from './entities/application-pipeline-step-template.entity';
import { ApplicationDocumentRequirement } from './entities/application-document-requirement.entity';
import { CustomerApplicationPipelineProgress } from './entities/customer-application-pipeline-progress.entity';
import { CustomerApplicationDocument } from './entities/customer-application-document.entity';
import { ApplicationTypesController } from './application-types.controller';
import { ApplicationTypesService } from './application-types.service';
import { ApplicationsSeedService } from './applications.seed.service';
import { ApplicationWorkflowTemplatesSeedService } from './application-workflow-templates.seed.service';
import { ApplicationWorkflowService } from './application-workflow.service';
import { S3StorageService } from './s3-storage.service';

/**
 * Application-domain APIs (types, workflow templates, S3 presigns, and future extensions).
 * Customer profile + enrollment rows stay in {@link CustomersModule}.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      ApplicationType,
      ApplicationPipelineStepTemplate,
      ApplicationDocumentRequirement,
      CustomerApplicationPipelineProgress,
      CustomerApplicationDocument,
    ]),
  ],
  controllers: [ApplicationTypesController],
  providers: [
    ApplicationTypesService,
    ApplicationsSeedService,
    ApplicationWorkflowTemplatesSeedService,
    ApplicationWorkflowService,
    S3StorageService,
  ],
  exports: [
    ApplicationTypesService,
    ApplicationWorkflowService,
    S3StorageService,
    TypeOrmModule,
  ],
})
export class ApplicationsModule {}
