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
import { CustomerDocumentOverrideDto } from './customer-document-override.dto';
import { CustomerCustomDocumentDto } from './customer-custom-document.dto';
import { CustomerPipelineStepOverrideDto } from './customer-pipeline-step-override.dto';
import { CustomerCustomPipelineStepDto } from './customer-custom-pipeline-step.dto';

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

  /** Rename, reorder, or soft-remove template documents for this customer only. */
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CustomerDocumentOverrideDto)
  documentOverrides?: CustomerDocumentOverrideDto[];

  /** Add customer-specific custom document requirements. */
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CustomerCustomDocumentDto)
  customDocuments?: CustomerCustomDocumentDto[];

  /** Rename or soft-remove template pipeline steps for this customer only. */
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CustomerPipelineStepOverrideDto)
  pipelineOverrides?: CustomerPipelineStepOverrideDto[];

  /** Add customer-specific custom pipeline steps. */
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CustomerCustomPipelineStepDto)
  customPipelineSteps?: CustomerCustomPipelineStepDto[];
}
