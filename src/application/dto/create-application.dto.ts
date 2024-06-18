import { ApiProperty } from '@nestjs/swagger';
import { Country, Season } from '@prisma/client';
import { Expose } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateApplicationDto {
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
  @IsUUID()
  @IsNotEmpty()
  @Expose()
  studentId: string;

  @ApiProperty()
  @IsEnum(Season)
  @IsOptional()
  @Expose()
  intake: Season;
}

export class CreatePendingDocumentDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Expose()
  name: string;

  @IsString()
  @IsOptional()
  fileUrl: string;

  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  @Expose()
  applicationId: string;
}
