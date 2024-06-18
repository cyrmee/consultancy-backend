import { ApiProperty } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
import { IsEmail, IsOptional, IsPhoneNumber } from 'class-validator';

export class EditUserDto {
  @ApiProperty()
  @IsEmail()
  @IsOptional()
  @Expose()
  @Transform(({ value }) => (value ? value.toLowerCase() : value))
  email?: string;

  @ApiProperty()
  @IsPhoneNumber()
  @IsOptional()
  @Expose()
  phoneNumber?: string;
}
