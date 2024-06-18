import { Expose, Type } from 'class-transformer';
import { ApplicationDto } from '../../base/dto';

export class CalendarDto {
  @Expose() id: string;
  @Expose() startDate: Date;
  @Expose() endDate: Date;
  @Expose() title: string;
  @Expose() description: string;
  @Expose() color: string;

  @Expose() @Type(() => ApplicationDto) application: ApplicationDto;
}
