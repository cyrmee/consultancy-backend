import { Gender } from '@prisma/client';
import { Expose } from 'class-transformer';

export class StudentDto {
  @Expose() id: string;
  @Expose() firstName: string;
  @Expose() lastName: string;
  @Expose() gender: Gender;
  @Expose() dateOfBirth?: Date;
  @Expose() admissionEmail: string;
  @Expose() branch: string;
  @Expose() isActive: boolean;
  @Expose() image?: string;
}
