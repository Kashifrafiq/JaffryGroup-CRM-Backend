import { IsEmail, IsEnum, IsNotEmpty, IsObject, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { CustomerApplicationStatus } from '../entities/customer-application-status.enum';

export class CreateCustomerApiDto {
  @IsNotEmpty()
  @IsString()
  name!: string;

  @IsEmail()
  email!: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(64)
  phone!: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(1024)
  property!: string;

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

  @IsOptional()
  @IsObject()
  pipeline?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  profilePhoto?: string;

  @IsOptional()
  @IsUUID()
  associateId?: string;
}
