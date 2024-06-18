import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import {
  IsUUID,
  IsNotEmpty,
  IsString,
  IsOptional,
  IsDate,
  IsNumber,
} from 'class-validator';

export class CreateEducationBackgroundDto {
  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  @Expose()
  studentId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Expose()
  institution: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Expose()
  degree: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  @Expose()
  fieldOfStudy?: string;

  @ApiProperty()
  @IsDate({
    message: 'Invalid date of birth format. Use ISO-8601 DateTime format.',
  })
  @IsNotEmpty()
  @Type(() => Date)
  @Expose()
  startDate: Date;

  @ApiProperty()
  @IsDate({
    message: 'Invalid date of birth format. Use ISO-8601 DateTime format.',
  })
  @IsOptional()
  @Type(() => Date)
  @Expose()
  endDate?: Date;

  @ApiProperty()
  @IsNumber()
  @IsOptional()
  @Expose()
  gpa?: number;

  @ApiProperty()
  @IsNumber({ allowNaN: true })
  @IsOptional()
  @Expose()
  rank?: number;
}
