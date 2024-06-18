import { Module } from '@nestjs/common';
import { EducationBackgroundService } from './education-background.service';
import { EducationBackgroundController } from './education-background.controller';

@Module({
  providers: [EducationBackgroundService],
  controllers: [EducationBackgroundController],
  exports: [EducationBackgroundService],
})
export class EducationBackgroundModule {}
