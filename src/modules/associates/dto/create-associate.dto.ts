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
} from 'class-validator';
import { UserRole } from '../../users/entities/user-role.enum';

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
}
