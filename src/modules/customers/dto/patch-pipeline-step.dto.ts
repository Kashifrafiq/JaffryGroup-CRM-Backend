import { IsBoolean } from 'class-validator';

export class PatchPipelineStepDto {
  @IsBoolean()
  completed!: boolean;
}
