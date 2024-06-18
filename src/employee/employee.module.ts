import { Module } from '@nestjs/common';
import { EmployeeController } from './employee.controller';
import { EmployeeService } from './employee.service';
import { MailModule } from '../mail/mail.module';

@Module({
  providers: [EmployeeService],
  controllers: [EmployeeController],
  exports: [EmployeeService],
  imports: [MailModule],
})
export class EmployeeModule {}
