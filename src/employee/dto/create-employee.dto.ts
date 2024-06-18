import { ApiProperty } from '@nestjs/swagger';
import { Gender, Role } from '@prisma/client';
import { Expose, Transform, Type } from 'class-transformer';
import {
  IsDate,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsPhoneNumber,
  IsString,
  IsStrongPassword,
} from 'class-validator';

export class CreateEmployeeDto {
  @ApiProperty()
  @IsEmail()
  @IsNotEmpty()
  @Expose()
  @Transform(({ value }) => (value ? value.toLowerCase() : value))
  email: string;

  @ApiProperty()
  @IsEnum(Role, { each: true })
  @IsNotEmpty()
  @Expose()
  roles: Role[];

  @ApiProperty()
  @IsStrongPassword()
  @IsNotEmpty()
  @Expose()
  password: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Expose()
  firstName: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Expose()
  lastName: string;

  @ApiProperty()
  @IsEnum(Gender)
  @IsNotEmpty()
  @Expose()
  gender: Gender;

  @ApiProperty()
  @IsPhoneNumber()
  @IsNotEmpty()
  @Expose()
  phoneNumber: string;

  @ApiProperty()
  @IsDate({
    message: 'Invalid date of birth format. Use ISO-8601 DateTime format.',
  })
  @IsNotEmpty()
  @Type(() => Date)
  @Expose()
  dateOfBirth?: Date;
}
