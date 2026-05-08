import { IsEmail, IsString, MaxLength } from 'class-validator';

export class InviteCustomerDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MaxLength(128)
  firstName!: string;

  @IsString()
  @MaxLength(128)
  lastName!: string;
}
