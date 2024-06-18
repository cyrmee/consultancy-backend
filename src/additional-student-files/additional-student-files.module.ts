import { Module } from '@nestjs/common';
import { AdditionalStudentFilesController } from './additional-student-files.controller';
import { AdditionalStudentFilesService } from './additional-student-files.service';

@Module({
  controllers: [AdditionalStudentFilesController],
  providers: [AdditionalStudentFilesService],
  exports: [AdditionalStudentFilesService],
})
export class AdditionalStudentFilesModule {}
