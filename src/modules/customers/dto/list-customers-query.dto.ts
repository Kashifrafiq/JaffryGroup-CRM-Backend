import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class ListCustomersQueryDto {
  @IsOptional()
  @IsUUID()
  applicationTypeId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  applicationTypeCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(320)
  email?: string;
}
