import { IsEnum, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { CustomerApplicationStatus } from '../entities/customer-application-status.enum';

export class UpdateCustomerApplicationDto {
  @IsOptional()
  @IsUUID()
  applicationTypeId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  applicationTypeCode?: string;

  @IsOptional()
  @IsEnum(CustomerApplicationStatus)
  status?: CustomerApplicationStatus;
}
