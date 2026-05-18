import { ArrayMinSize, IsArray, IsString } from 'class-validator';

export class AssignPipelineStepAssociatesDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  associateIds!: string[];
}
