import { IsBoolean, IsInt, IsOptional, IsString, IsUUID, MaxLength, Min } from 'class-validator';

export class CustomerPipelineStepOverrideDto {
  @IsOptional()
  @IsUUID()
  applicationTypeId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  applicationTypeCode?: string;

  /** Match template step on create (from workflow-template pipelineSteps[].stepIndex). */
  @IsOptional()
  @IsInt()
  @Min(0)
  stepIndex?: number;

  /** Match existing customer pipeline row on edit. */
  @IsOptional()
  @IsUUID()
  pipelineProgressId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(512)
  title?: string;

  /** When true, soft-hide this step for this customer only. */
  @IsOptional()
  @IsBoolean()
  removed?: boolean;
}
