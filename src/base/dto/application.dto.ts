import { ApplicationStatus } from '@prisma/client';
import { Expose } from 'class-transformer';

export class ApplicationDto {
  @Expose() id: string;
  @Expose() country: string;
  @Expose() educationalLevel: string;
  @Expose() fieldOfStudy: string;
  @Expose() intake: string;
  @Expose() applicationStatus: ApplicationStatus;
}
