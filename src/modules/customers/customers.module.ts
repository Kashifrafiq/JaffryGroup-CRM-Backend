import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApplicationsModule } from '../applications/applications.module';
import { CustomerProfile } from '../users/entities/customer-profile.entity';
import { User } from '../users/entities/user.entity';
import { AssociatePipelineStep } from '../users/entities/associate-pipeline-step.entity';
import { AssociateCustomerApplicationDocument } from '../users/entities/associate-customer-application-document.entity';
import { AssociateProfile } from '../users/entities/associate-profile.entity';
import { CustomerApplicationPipelineProgress } from '../applications/entities/customer-application-pipeline-progress.entity';
import { CustomerApplicationDocument } from '../applications/entities/customer-application-document.entity';
import { CustomerApplicationDocumentFile } from '../applications/entities/customer-application-document-file.entity';
import { CustomerApplication } from './entities/customer-application.entity';
import { CustomerInvite } from './entities/customer-invite.entity';
import { CustomersController } from './customers.controller';
import { CustomerApplicationWorkflowController } from './customer-application-workflow.controller';
import { CustomersService } from './customers.service';
import { CustomerApplicationWorkflowService } from './customer-application-workflow.service';
import { PipelineStepAssignmentService } from './pipeline-step-assignment.service';
import { DocumentAssignmentService } from './document-assignment.service';
import { CustomerDocumentCustomizationService } from './customer-document-customization.service';
import { CustomerPipelineCustomizationService } from './customer-pipeline-customization.service';
import { CustomerInviteMailService } from './customer-invite-mail.service';

@Module({
  imports: [
    ApplicationsModule,
    TypeOrmModule.forFeature([
      CustomerProfile,
      CustomerApplication,
      AssociatePipelineStep,
      AssociateCustomerApplicationDocument,
      AssociateProfile,
      CustomerApplicationPipelineProgress,
      CustomerInvite,
      User,
      CustomerApplicationDocument,
      CustomerApplicationDocumentFile,
    ]),
  ],
  controllers: [CustomerApplicationWorkflowController, CustomersController],
  providers: [
    CustomersService,
    CustomerApplicationWorkflowService,
    PipelineStepAssignmentService,
    DocumentAssignmentService,
    CustomerDocumentCustomizationService,
    CustomerPipelineCustomizationService,
    CustomerInviteMailService,
  ],
  exports: [CustomersService, PipelineStepAssignmentService, DocumentAssignmentService, CustomerDocumentCustomizationService, CustomerPipelineCustomizationService],
})
export class CustomersModule {}
