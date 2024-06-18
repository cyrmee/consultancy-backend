import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import {
  IsUUID,
  IsNotEmpty,
  IsString,
  IsOptional,
  IsPhoneNumber,
  IsDate,
} from 'class-validator';

export class EditStudentRelationsDto {
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
}
