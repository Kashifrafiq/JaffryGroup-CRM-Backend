import { IsEnum } from 'class-validator';
import { TaskStatus } from '../entities/task.enums';

export class PatchTaskStatusDto {
  @IsEnum(TaskStatus)
  status!: TaskStatus;
}
