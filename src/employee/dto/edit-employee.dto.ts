import { ApiProperty } from '@nestjs/swagger';
import { Gender, Role } from '@prisma/client';
import { Expose, Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
  IsString,
  IsStrongPassword,
  IsUUID,
} from 'class-validator';

export class EditEmployeeDto {
  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  @Expose()
  id: string;

  @ApiProperty()
  @IsEmail()
  @IsOptional()
  @Expose()
  @Transform(({ value }) => (value ? value.toLowerCase() : value))
  email?: string;

  @ApiProperty()
  @IsStrongPassword()
  @IsOptional()
  @Expose()
  password?: string;

  @ApiProperty()
  @IsEnum(Role, { each: true })
  @IsOptional()
  @Expose()
  roles?: Role[];

  @ApiProperty()
  @IsString()
  @IsOptional()
  @Expose()
  firstName?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  @Expose()
  lastName?: string;

  @ApiProperty()
  @IsEnum(Gender)
  @IsOptional()
  @Expose()
  gender?: Gender;

  @ApiProperty()
  @IsPhoneNumber()
  @IsOptional()
  @Expose()
  phoneNumber?: string;

  @ApiProperty()
  @IsBoolean()
  @IsOptional()
  @Expose()
  isSuspended?: boolean;

  @ApiProperty()
  @IsDate({
    message: 'Invalid date of birth format. Use ISO-8601 DateTime format.',
  })
  @IsOptional()
  @Type(() => Date)
  @Expose()
  dateOfBirth?: Date;
}
