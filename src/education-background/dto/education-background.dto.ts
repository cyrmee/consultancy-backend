import { Expose } from 'class-transformer';

export class EducationBackgroundDto {
  @Expose() id: string;
  @Expose() institution: string;
  @Expose() degree: string;
  @Expose() fieldOfStudy?: string;
  @Expose() startDate: Date;
  @Expose() endDate?: Date;
  @Expose() gpa?: number;
  @Expose() rank?: number;
  @Expose() certificateFileUri?: string;
  @Expose() transcriptFileUri?: string;
}
