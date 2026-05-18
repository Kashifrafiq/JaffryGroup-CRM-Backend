import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApplicationsModule } from '../applications/applications.module';
import { CustomerProfile } from '../users/entities/customer-profile.entity';
import { User } from '../users/entities/user.entity';
import { AssociateCustomer } from '../users/entities/associate-customer.entity';
import { AssociatePipelineStep } from '../users/entities/associate-pipeline-step.entity';
import { AssociateProfile } from '../users/entities/associate-profile.entity';
import { CustomerApplicationPipelineProgress } from '../applications/entities/customer-application-pipeline-progress.entity';
import { CustomerApplication } from './entities/customer-application.entity';
import { CustomerInvite } from './entities/customer-invite.entity';
import { CustomersController } from './customers.controller';
import { CustomerApplicationWorkflowController } from './customer-application-workflow.controller';
import { CustomersService } from './customers.service';
import { CustomerApplicationWorkflowService } from './customer-application-workflow.service';
import { PipelineStepAssignmentService } from './pipeline-step-assignment.service';
import { CustomerInviteMailService } from './customer-invite-mail.service';

@Module({
  imports: [
    ApplicationsModule,
    TypeOrmModule.forFeature([
      CustomerProfile,
      CustomerApplication,
      AssociateCustomer,
      AssociatePipelineStep,
      AssociateProfile,
      CustomerApplicationPipelineProgress,
      CustomerInvite,
      User,
    ]),
  ],
  controllers: [CustomerApplicationWorkflowController, CustomersController],
  providers: [
    CustomersService,
    CustomerApplicationWorkflowService,
    PipelineStepAssignmentService,
    CustomerInviteMailService,
  ],
  exports: [CustomersService, PipelineStepAssignmentService],
})
export class CustomersModule {}
