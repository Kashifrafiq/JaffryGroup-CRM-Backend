import { IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength, Min } from 'class-validator';

export class CustomerCustomDocumentDto {
  @IsOptional()
  @IsUUID()
  applicationTypeId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  applicationTypeCode?: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(512)
  sectionTitle!: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(512)
  itemLabel!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
