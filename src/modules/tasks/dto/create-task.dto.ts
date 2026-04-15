import { IsDateString, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateTaskDto {
  @IsNotEmpty()
  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  information?: string;

  @IsDateString()
  startDate!: string;

  @IsDateString()
  dueDate!: string;

  @IsUUID()
  associateAssignedId!: string;
}
