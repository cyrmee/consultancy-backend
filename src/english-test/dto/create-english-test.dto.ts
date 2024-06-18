import { ApiProperty } from '@nestjs/swagger';
import { Expose, Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateEnglishTestDto {
  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  @Expose()
  applicationId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Expose()
  practiceLink: string;

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
  @IsEmail()
  @IsNotEmpty()
  @Expose()
  @Transform(({ value }) => (value ? value.toLowerCase() : value))
  email: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Expose()
  password: string;

  @ApiProperty()
  @IsBoolean()
  @IsOptional()
  @Expose()
  hasPassed?: boolean;
}
