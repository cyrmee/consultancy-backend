import { ApiProperty } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsPhoneNumber, IsString } from 'class-validator';

export class VerifyOtpByEmailDto {
  @ApiProperty()
  @Expose()
  @IsEmail()
  @IsNotEmpty()
  @Transform(({ value }) => (value ? value.toLowerCase() : value))
  email: string;

  @ApiProperty()
  @Expose()
  @IsString()
  @IsNotEmpty()
  otp: string;
}

export class VerifyOtpByPhoneNumberDto {
  @ApiProperty()
  @Expose()
  @IsPhoneNumber()
  @IsNotEmpty()
  phoneNumber: string;

  @ApiProperty()
  @Expose()
  @IsString()
  @IsNotEmpty()
  otp: string;
}
