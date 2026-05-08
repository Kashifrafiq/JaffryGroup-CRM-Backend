import { IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { CustomerReminderStatus } from '../entities/customer-reminder.enums';

export class CreateCustomerReminderDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(200)
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsDateString()
  remindAt!: string;

  @IsOptional()
  @IsEnum(CustomerReminderStatus)
  status?: CustomerReminderStatus;
}
