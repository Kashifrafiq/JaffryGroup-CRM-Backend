import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApplicationsModule } from '../applications/applications.module';
import { CustomerProfile } from '../users/entities/customer-profile.entity';
import { AssociateCustomer } from '../users/entities/associate-customer.entity';
import { AssociateProfile } from '../users/entities/associate-profile.entity';
import { CustomerApplication } from './entities/customer-application.entity';
import { CustomersController } from './customers.controller';
import { CustomerApplicationWorkflowController } from './customer-application-workflow.controller';
import { CustomersService } from './customers.service';
import { CustomerApplicationWorkflowService } from './customer-application-workflow.service';

@Module({
  imports: [
    ApplicationsModule,
    TypeOrmModule.forFeature([CustomerProfile, CustomerApplication, AssociateCustomer, AssociateProfile]),
  ],
  controllers: [CustomerApplicationWorkflowController, CustomersController],
  providers: [CustomersService, CustomerApplicationWorkflowService],
  exports: [CustomersService],
})
export class CustomersModule {}
