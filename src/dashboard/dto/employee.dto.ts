import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class EmployeeRoleCountDto {
  @Expose() @ApiProperty() admin: number = 0;
  @Expose() @ApiProperty() agent: number = 0;
  @Expose() @ApiProperty() admission: number = 0;
  @Expose() @ApiProperty() finance: number = 0;
  @Expose() @ApiProperty() visa: number = 0;
  @Expose() @ApiProperty() total: number = 0;
}
