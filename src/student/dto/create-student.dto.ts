import { ApiProperty } from '@nestjs/swagger';
import { Country, Gender, Season } from '@prisma/client';
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
} from 'class-validator';

export class CreateStudentDto {
  @ApiProperty()
  @IsEmail()
  @IsNotEmpty()
  @Expose()
  @Transform(({ value }) => (value ? value.toLowerCase() : value))
  email: string;

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
  @IsOptional()
  @Expose()
  phoneNumber?: string;

  @ApiProperty()
  @IsDate({
    message: 'Invalid date of birth format. Use ISO-8601 DateTime format.',
  })
  @IsOptional()
  @Type(() => Date)
  @Expose()
  dateOfBirth?: Date;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Expose()
  branch: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Expose()
  region: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Expose()
  city: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Expose()
  subCity: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Expose()
  woreda: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Expose()
  kebele: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Expose()
  houseNumber: string;

  @ApiProperty()
  @IsEnum(Country)
  @IsNotEmpty()
  @Expose()
  country: Country;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Expose()
  educationalLevel: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Expose()
  fieldOfStudy: string;

  @ApiProperty()
  @IsEnum(Season)
  @IsOptional()
  @Expose()
  intake: Season;

  @ApiProperty()
  @IsBoolean()
  @IsOptional()
  @Expose()
  isClient: boolean;
}
