import { IsBoolean, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class PatchCustomerDocumentDisplayDto {
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

  @IsOptional()
  @IsBoolean()
  removed?: boolean;
}
