import {
  Equals,
  IsDateString,
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';
import { UserRole } from '../entities/user.entity';

export class CreateAssociateDto {
  @IsNotEmpty()
  @IsString()
  name!: string;

  @IsEmail()
  email!: string;

  @IsEnum(UserRole)
  @Equals(UserRole.ASSOCIATE)
  role!: UserRole;

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

  @IsOptional()
  @MinLength(8)
  password?: string;
}
