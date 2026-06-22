import { IsBoolean, IsInt, IsOptional, IsString, IsUUID, MaxLength, Min } from 'class-validator';

export class CustomerDocumentOverrideDto {
  @IsOptional()
  @IsUUID()
  applicationTypeId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  applicationTypeCode?: string;

  /** Match template doc on create. */
  @IsOptional()
  @IsString()
  @MaxLength(160)
  requirementKey?: string;

  /** Match existing customer doc on edit. */
  @IsOptional()
  @IsUUID()
  documentId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(512)
  itemLabel?: string;

  @IsOptional()
  @IsString()
  @MaxLength(512)
  sectionTitle?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  /** When true, soft-hide this document for this customer only. */
  @IsOptional()
  @IsBoolean()
  removed?: boolean;
}
