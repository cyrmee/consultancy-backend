import { ApiProperty } from '@nestjs/swagger';
import { EventCategory } from '@prisma/client';
import { Expose, Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateCalendarDto {
  @ApiProperty()
  @Expose()
  @IsNotEmpty()
  @IsDate({
    message: 'Invalid date of birth format. Use ISO-8601 DateTime format.',
  })
  @Type(() => Date)
  startDate: Date;

  @ApiProperty()
  @Expose()
  @IsNotEmpty()
  @IsDate({
    message: 'Invalid date of birth format. Use ISO-8601 DateTime format.',
  })
  @Type(() => Date)
  endDate: Date;

  @ApiProperty()
  @Expose()
  @IsNotEmpty()
  @IsEnum(EventCategory)
  eventCategory: EventCategory;

  @ApiProperty() @Expose() @IsNotEmpty() @IsString() title: string;
  @ApiProperty() @Expose() @IsNotEmpty() @IsString() description: string;
  @ApiProperty() @Expose() @IsNotEmpty() @IsUUID() applicationId: string;
  @ApiProperty() @Expose() @IsNotEmpty() @IsString() externalId: string;
  @ApiProperty() @Expose() @IsNotEmpty() @IsString() color: string;
  @ApiProperty() @Expose() @IsOptional() @IsString() googleColor: string;

  @ApiProperty()
  @Expose()
  @IsOptional()
  @IsString()
  googleCalenderEventId: string;

  @ApiProperty() @Expose() @IsNotEmpty() @IsUUID() employeeId: string;
}
