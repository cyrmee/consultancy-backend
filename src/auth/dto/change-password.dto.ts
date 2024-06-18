import { ApiProperty } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
import { IsStrongPassword, IsNotEmpty, IsEmail } from 'class-validator';

export class ChangePasswordDto {
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
  currentPassword: string;

  @ApiProperty()
  @Expose()
  @IsStrongPassword()
  @IsNotEmpty()
  newPassword: string;
}
