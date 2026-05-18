import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RemindersController } from './reminders.controller';
import { RemindersService } from './reminders.service';
import { CustomerReminder } from './entities/customer-reminder.entity';
import { CustomerProfile } from '../users/entities/customer-profile.entity';
import { AssociateProfile } from '../users/entities/associate-profile.entity';
import { CustomersModule } from '../customers/customers.module';

@Module({
  imports: [
    CustomersModule,
    TypeOrmModule.forFeature([CustomerReminder, CustomerProfile, AssociateProfile]),
  ],
  controllers: [RemindersController],
  providers: [RemindersService],
})
export class RemindersModule {}
