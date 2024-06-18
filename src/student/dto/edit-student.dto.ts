import { ApiProperty } from '@nestjs/swagger';
import { Gender } from '@prisma/client';
import { Expose, Transform, Type } from 'class-transformer';
import {
  IsDate,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
  IsString,
  IsUUID,
} from 'class-validator';

export class EditStudentAddressDto {
  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  @Expose()
  studentId: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  @Expose()
  region?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  @Expose()
  city?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  @Expose()
  subCity?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  @Expose()
  woreda?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  @Expose()
  kebele?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  @Expose()
  houseNumber?: string;
}

export class EditPassportDto {
  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  @Expose()
  studentId: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  @Expose()
  passportNumber?: string;

  @ApiProperty()
  @IsDate({
    message: 'Invalid date of birth format. Use ISO-8601 DateTime format.',
  })
  @IsOptional()
  @Type(() => Date)
  @Expose()
  issueDate?: Date;

  @ApiProperty()
  @IsDate({
    message: 'Invalid date of birth format. Use ISO-8601 DateTime format.',
  })
  @IsOptional()
  @Type(() => Date)
  @Expose()
  expiryDate?: Date;

  @IsString()
  @IsOptional()
  passportAttachment?: string;
}

export class EditStudentDto {
  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  @Expose()
  id: string;

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
  @IsDate({
    message: 'Invalid date of birth format. Use ISO-8601 DateTime format.',
  })
  @IsOptional()
  @Type(() => Date)
  @Expose()
  dateOfBirth?: Date;

  @ApiProperty()
  @IsEmail()
  @IsOptional()
  @Expose()
  @Transform(({ value }) => (value ? value.toLowerCase() : value))
  admissionEmail?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  @Expose()
  branch?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  @Expose()
  image?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  @Expose()
  passportNumber?: string;

  @ApiProperty()
  @IsDate({
    message: 'Invalid date of birth format. Use ISO-8601 DateTime format.',
  })
  @IsOptional()
  @Type(() => Date)
  @Expose()
  issueDate?: Date;

  @ApiProperty()
  @IsDate({
    message: 'Invalid date of birth format. Use ISO-8601 DateTime format.',
  })
  @IsOptional()
  @Type(() => Date)
  @Expose()
  expiryDate?: Date;

  @ApiProperty()
  @IsString()
  @IsOptional()
  @Expose()
  passportAttachment?: string;

  // @ApiProperty()
  // @IsOptional()
  // @ValidateNested()
  // @Type(() => EditStudentAddressDto)
  // @Expose()
  // studentAddress?: EditStudentAddressDto;

  // studentRelations?: EditStudentRelationsDto[];
  // educationBackgrounds?: EditEducationBackgroundDto[];
  // applications?: EditApplicationDto[];
}
