import { Transform } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateCustomerActivityDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  activityType!: string;

  @IsNotEmpty()
  @IsString()
  details!: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === null || value === undefined) return undefined;
    if (typeof value === 'string' && value.trim() === '') return undefined;
    return value;
  })
  @IsUUID()
  associateId?: string;
}
