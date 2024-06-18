import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class GenderCountDto {
  @Expose() @ApiProperty() male: number = 0;
  @Expose() @ApiProperty() female: number = 0;
  @Expose() @ApiProperty() total: number = 0;
}

export class StudentActiveStatusCountDto {
  @Expose() @ApiProperty() active: number = 0;
  @Expose() @ApiProperty() inactive: number = 0;
  @Expose() @ApiProperty() total: number = 0;
}
