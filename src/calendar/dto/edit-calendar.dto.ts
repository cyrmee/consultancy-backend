import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsDate,
  IsString,
  IsOptional,
  IsBoolean,
} from 'class-validator';

export class EditCalendarDto {
  @ApiProperty() @Expose() @IsNotEmpty() @IsString() id: string;

  @ApiProperty()
  @Expose()
  @IsOptional()
  @IsDate({
    message: 'Invalid date of birth format. Use ISO-8601 DateTime format.',
  })
  @Type(() => Date)
  startDate?: Date;

  @ApiProperty()
  @Expose()
  @IsOptional()
  @IsDate({
    message: 'Invalid date of birth format. Use ISO-8601 DateTime format.',
  })
  @Type(() => Date)
  endDate?: Date;

  @ApiProperty() @Expose() @IsOptional() @IsString() title?: string;
  @ApiProperty() @Expose() @IsOptional() @IsString() description?: string;
  @ApiProperty() @Expose() @IsOptional() @IsString() applicationId?: string;
  @ApiProperty() @Expose() @IsOptional() @IsString() externalId?: string;
  @ApiProperty() @Expose() @IsOptional() @IsBoolean() isAttended?: boolean;

  @ApiProperty()
  @Expose()
  @IsOptional()
  @IsString()
  googleCalenderEventId: string;
}
