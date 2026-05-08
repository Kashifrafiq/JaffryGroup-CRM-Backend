import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RemindersController } from './reminders.controller';
import { RemindersService } from './reminders.service';
import { CustomerReminder } from './entities/customer-reminder.entity';
import { CustomerProfile } from '../users/entities/customer-profile.entity';
import { AssociateProfile } from '../users/entities/associate-profile.entity';
import { AssociateCustomer } from '../users/entities/associate-customer.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CustomerReminder,
      CustomerProfile,
      AssociateProfile,
      AssociateCustomer,
    ]),
  ],
  controllers: [RemindersController],
  providers: [RemindersService],
})
export class RemindersModule {}
