import { ApiProperty } from '@nestjs/swagger';
import { EnglishTestStatus } from '@prisma/client';
import { Expose, Type } from 'class-transformer';
import {
  IsUUID,
  IsNotEmpty,
  IsString,
  IsOptional,
  IsDate,
  IsEnum,
} from 'class-validator';

export class EditEnglishTestDto {
  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  @Expose()
  applicationId: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  @Expose()
  practiceLink?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  @Expose()
  practiceLink2?: string;

  @ApiProperty()
  @IsDate({
    message: 'Invalid date of birth format. Use ISO-8601 DateTime format.',
  })
  @IsOptional()
  @Type(() => Date)
  @Expose()
  testDate?: Date;

  @ApiProperty()
  @IsString()
  @IsOptional()
  @Expose()
  score?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  @Expose()
  email?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  @Expose()
  password?: string;

  @ApiProperty()
  @IsEnum(EnglishTestStatus)
  @IsOptional()
  @Expose()
  hasPassed?: EnglishTestStatus;
}
