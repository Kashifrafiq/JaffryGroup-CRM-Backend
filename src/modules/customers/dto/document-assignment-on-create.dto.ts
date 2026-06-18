import { IsArray, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class DocumentAssignmentOnCreateDto {
  @IsOptional()
  @IsUUID()
  applicationTypeId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  applicationTypeCode?: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(128)
  requirementKey!: string;

  @IsArray()
  @IsUUID('4', { each: true })
  associateIds!: string[];
}
