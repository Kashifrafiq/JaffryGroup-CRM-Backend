import { IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength, Min } from 'class-validator';

export class CustomerCustomPipelineStepDto {
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
  title!: string;

  /** Defaults to max(stepIndex) + 1 for the application. */
  @IsOptional()
  @IsInt()
  @Min(0)
  stepIndex?: number;
}
