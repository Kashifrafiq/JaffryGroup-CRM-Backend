import { PartialType } from '@nestjs/mapped-types';
import { CreateCustomerReminderDto } from './create-customer-reminder.dto';

export class UpdateCustomerReminderDto extends PartialType(CreateCustomerReminderDto) {}
