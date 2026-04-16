import { IsDateString, IsEmail, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { AssociateStatus } from '../../users/entities/associate-profile.entity';

export class CreateAssociateDto {
  @IsOptional()
  @IsString()
  name!: string;

  @IsEmail()
  email!: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(128)
  role!: string;

  @IsString()
  department!: string;

  @IsOptional()
  @IsEnum(AssociateStatus)
  status?: AssociateStatus;

  @IsOptional()
  @IsDateString()
  lastActive?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  taskAssigned?: number;

  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  profilePhoto?: string;
}
