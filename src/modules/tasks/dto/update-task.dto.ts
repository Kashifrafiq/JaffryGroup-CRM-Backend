import { OmitType, PartialType } from '@nestjs/mapped-types';
import { IsOptional, IsUUID, ValidateIf } from 'class-validator';
import { CreateTaskDto } from './create-task.dto';

export class UpdateTaskDto extends PartialType(OmitType(CreateTaskDto, ['assignedTo'] as const)) {
  @IsOptional()
  @ValidateIf((_obj, v) => v !== null && v !== undefined && String(v).trim() !== '')
  @IsUUID()
  assignedTo?: string | null;
}
