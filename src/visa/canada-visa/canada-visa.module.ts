import { Module } from '@nestjs/common';
import { CanadaVisaController } from './canada-visa.controller';
import { CanadaVisaService } from './canada-visa.service';
import { NotificationModule } from '../../notification/notification.module';
import { CalendarModule } from '../../calendar/calendar.module';

@Module({
  imports: [NotificationModule, CalendarModule],
  controllers: [CanadaVisaController],
  providers: [CanadaVisaService],
})
export class CanadaVisaModule {}
