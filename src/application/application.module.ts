import { Module } from '@nestjs/common';
import { ApplicationService } from './application.service';
import { ApplicationController } from './application.controller';
import { NotificationModule } from '../notification/notification.module';
import { CalendarModule } from '../calendar/calendar.module';

@Module({
  imports: [NotificationModule, CalendarModule],
  providers: [ApplicationService],
  controllers: [ApplicationController],
  exports: [ApplicationService],
})
export class ApplicationModule {}
