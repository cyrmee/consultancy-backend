import { Module } from '@nestjs/common';
import { StudentService } from './student.service';
import { StudentController } from './student.controller';
import { MailModule } from '../mail/mail.module';
import { NotificationModule } from '../notification/notification.module';
import { CalendarModule } from '../calendar/calendar.module';

@Module({
  providers: [StudentService],
  controllers: [StudentController],
  imports: [MailModule, NotificationModule, CalendarModule],
})
export class StudentModule {}
