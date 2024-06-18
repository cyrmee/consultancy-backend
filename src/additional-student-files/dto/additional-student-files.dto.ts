import { AdditionalFileType } from '@prisma/client';
import { Expose } from 'class-transformer';

export class AdditionalStudentFilesDto {
  @Expose() id: string;
  @Expose() studentId: string;
  @Expose() fileType: AdditionalFileType;
  @Expose() fileUri: string;
}
