import { Module } from '@nestjs/common';
import { EnglishTestController } from './english-test.controller';
import { EnglishTestService } from './english-test.service';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [NotificationModule],
  controllers: [EnglishTestController],
  providers: [EnglishTestService],
  exports: [EnglishTestService],
})
export class EnglishTestModule {}
