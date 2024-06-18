import { Module } from '@nestjs/common';
import { DepositService } from './deposit.service';
import { DepositController } from './deposit.controller';
import { CalendarModule } from '../calendar/calendar.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [CalendarModule, NotificationModule],
  providers: [DepositService],
  controllers: [DepositController],
  exports: [DepositService],
})
export class DepositModule {}
