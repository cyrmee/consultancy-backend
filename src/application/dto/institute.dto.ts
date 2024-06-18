import { AdmissionStatus } from '@prisma/client';
import { Expose } from 'class-transformer';

export class InstituteDto {
  @Expose() id: string;
  @Expose() name: string;
  @Expose() comment: string;
  @Expose() admissionStatus: AdmissionStatus;
}
