import { IsOptional, IsUUID } from 'class-validator';

export class ListCustomerPipelineStepsQueryDto {
  /** Associate profile id — returns only pipeline steps assigned to this associate. */
  @IsUUID()
  associateId!: string;

  @IsOptional()
  @IsUUID()
  applicationId?: string;
}
