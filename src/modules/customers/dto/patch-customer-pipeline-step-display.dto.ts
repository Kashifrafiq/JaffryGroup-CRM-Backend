import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class PatchCustomerPipelineStepDisplayDto {
  @IsOptional()
  @IsString()
  @MaxLength(512)
  title?: string;

  @IsOptional()
  @IsBoolean()
  removed?: boolean;
}
