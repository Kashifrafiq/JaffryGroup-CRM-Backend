import {
  IsArray,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CustomerApplicationStatus } from '../entities/customer-application-status.enum';
import { DocumentAssignmentOnCreateDto } from './document-assignment-on-create.dto';

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
  @IsArray()
  @IsUUID('4', { each: true })
  applicationTypeIds?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(64, { each: true })
  applicationTypeCodes?: string[];

  @IsOptional()
  @IsEnum(CustomerApplicationStatus)
  status?: CustomerApplicationStatus;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  profilePhoto?: string;

  @IsOptional()
  @IsUUID()
  associateId?: string;

  /** Assign associates to specific document requirements (by requirementKey). */
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DocumentAssignmentOnCreateDto)
  documentAssignments?: DocumentAssignmentOnCreateDto[];
}
