import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength, ValidateIf } from 'class-validator';
import { UserRole } from '../entities/user-role.enum';

export class CreateCustomerDto {
  @IsNotEmpty()
  @IsString()
  name!: string;

  @IsEmail()
  email!: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(64)
  phone!: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(1024)
  property!: string;

  @ValidateIf((o) => !o.applicationTypeId && !o.applicationTypeCode)
  @IsNotEmpty()
  @IsString()
  @MaxLength(128)
  applicationType?: string;

  @IsOptional()
  @IsUUID()
  applicationTypeId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  applicationTypeCode?: string;

  /** Defaults to `customer` when omitted. */
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  profilePhoto?: string;
}
