import { ApiProperty } from '@nestjs/swagger';
import { Relationship } from '@prisma/client';
import { Expose, Type } from 'class-transformer';
import {
  IsUUID,
  IsNotEmpty,
  IsString,
  IsPhoneNumber,
  IsOptional,
  IsDate,
  IsEnum,
} from 'class-validator';

export class CreateStudentRelationsDto {
  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  @Expose()
  studentId: string;

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
  @IsPhoneNumber()
  @IsOptional()
  @Expose()
  phoneNumber?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  @Expose()
  educationalLevel?: string;

  @ApiProperty()
  @IsDate({
    message: 'Invalid date of birth format. Use ISO-8601 DateTime format.',
  })
  @IsOptional()
  @Type(() => Date)
  @Expose()
  dateOfBirth?: Date;

  @ApiProperty()
  @IsEnum(Relationship)
  @IsNotEmpty()
  @Expose()
  relationship: Relationship;
}
