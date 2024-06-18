import { ApiProperty } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsStrongPassword,
} from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty()
  @Expose()
  @IsEmail()
  @IsNotEmpty()
  @Transform(({ value }) => (value ? value.toLowerCase() : value))
  email: string;

  @ApiProperty()
  @Expose()
  @IsStrongPassword()
  @IsNotEmpty()
  password: string;

  @ApiProperty()
  @Expose()
  @IsString()
  @IsNotEmpty()
  resetPasswordToken: string;
}
