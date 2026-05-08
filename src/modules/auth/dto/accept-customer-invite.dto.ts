import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class AcceptCustomerInviteDto {
  @IsString()
  token!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MaxLength(128)
  firstName!: string;

  @IsString()
  @MaxLength(128)
  lastName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1024)
  property?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(512)
  profilePhoto?: string;
}
