import { IsArray, IsString } from 'class-validator';

export class ReplacePipelineStepAssociatesDto {
  @IsArray()
  @IsString({ each: true })
  associateIds!: string[];
}
