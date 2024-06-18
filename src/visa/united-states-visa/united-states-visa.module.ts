import { Module } from '@nestjs/common';
import { UnitedStatesVisaService } from './united-states-visa.service';
import { UnitedStatesVisaController } from './united-states-visa.controller';
import { NotificationModule } from '../../notification/notification.module';
import { CalendarModule } from '../../calendar/calendar.module';

@Module({
  imports: [NotificationModule, CalendarModule],
  providers: [UnitedStatesVisaService],
  controllers: [UnitedStatesVisaController],
})
export class UnitedStatesVisaModule {}
