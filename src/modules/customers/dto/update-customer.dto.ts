import { IsArray, IsEmail, IsOptional, IsString, MaxLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { DocumentAssignmentDto } from './document-assignment.dto';

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
}
