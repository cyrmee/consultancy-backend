import { ApiProperty } from '@nestjs/swagger';
import {
  AdmissionStatus,
  ApplicationStatus,
  EnglishTestRequiredStatus,
  Season,
} from '@prisma/client';
import { Expose } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class EditApplicationDto {
  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  @Expose()
  id: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  @Expose()
  educationalLevel?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  @Expose()
  fieldOfStudy?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  @Expose()
  institute?: string;

  @ApiProperty()
  @IsEnum(Season)
  @IsOptional()
  @Expose()
  intake?: Season;

  @ApiProperty()
  @IsEnum(EnglishTestRequiredStatus)
  @IsOptional()
  @Expose()
  englishTestRequired?: EnglishTestRequiredStatus;

  @ApiProperty()
  @IsEnum(ApplicationStatus)
  @IsOptional()
  @Expose()
  applicationStatus: ApplicationStatus;

  @ApiProperty()
  @IsEnum(AdmissionStatus)
  @IsOptional()
  @Expose()
  admissionStatus: AdmissionStatus;
}

export class EditPendingDocument {
  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  @Expose()
  id: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  @Expose()
  name?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  @Expose()
  fileUrl?: string;
}
