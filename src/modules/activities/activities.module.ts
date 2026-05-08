import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActivitiesController } from './activities.controller';
import { ActivitiesService } from './activities.service';
import { CustomerActivity } from './entities/customer-activity.entity';
import { CustomerProfile } from '../users/entities/customer-profile.entity';
import { AssociateProfile } from '../users/entities/associate-profile.entity';
import { AssociateCustomer } from '../users/entities/associate-customer.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CustomerActivity,
      CustomerProfile,
      AssociateProfile,
      AssociateCustomer,
    ]),
  ],
  controllers: [ActivitiesController],
  providers: [ActivitiesService],
})
export class ActivitiesModule {}
