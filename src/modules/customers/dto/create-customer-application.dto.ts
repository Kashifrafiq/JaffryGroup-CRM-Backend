import { IsEnum, IsObject, IsOptional, IsString, IsUUID, MaxLength, ValidateIf } from 'class-validator';
import { CustomerApplicationStatus } from '../entities/customer-application-status.enum';

export class CreateCustomerApplicationDto {
  @ValidateIf((o) => !o.applicationTypeCode)
  @IsOptional()
  @IsUUID()
  applicationTypeId?: string;

  @ValidateIf((o) => !o.applicationTypeId)
  @IsOptional()
  @IsString()
  @MaxLength(64)
  applicationTypeCode?: string;

  @IsOptional()
  @IsEnum(CustomerApplicationStatus)
  status?: CustomerApplicationStatus;

  @IsOptional()
  @IsObject()
  pipeline?: Record<string, unknown>;
}
