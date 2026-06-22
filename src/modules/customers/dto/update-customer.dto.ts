import { IsArray, IsEmail, IsOptional, IsString, MaxLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { DocumentAssignmentDto } from './document-assignment.dto';
import { CustomerDocumentOverrideDto } from './customer-document-override.dto';
import { CustomerCustomDocumentDto } from './customer-custom-document.dto';
import { CustomerPipelineStepOverrideDto } from './customer-pipeline-step-override.dto';
import { CustomerCustomPipelineStepDto } from './customer-custom-pipeline-step.dto';

export class UpdateCustomerDto {
  @IsOptional()
  @IsString()
  @MaxLength(512)
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1024)
  property?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  profilePhoto?: string;

  /** Replace associate assignments per document (by documentId). */
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DocumentAssignmentDto)
  documentAssignments?: DocumentAssignmentDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CustomerDocumentOverrideDto)
  documentOverrides?: CustomerDocumentOverrideDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CustomerCustomDocumentDto)
  customDocuments?: CustomerCustomDocumentDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CustomerPipelineStepOverrideDto)
  pipelineOverrides?: CustomerPipelineStepOverrideDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CustomerCustomPipelineStepDto)
  customPipelineSteps?: CustomerCustomPipelineStepDto[];
}
