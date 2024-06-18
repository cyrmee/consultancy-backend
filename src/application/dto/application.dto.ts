import { Expose, Type } from 'class-transformer';
import {
  AdmissionStatus,
  ApplicationStatus,
  Country,
  EnglishTestRequiredStatus,
  Season,
} from '@prisma/client';
import { StudentDto } from '../../base/dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { InstituteDto } from './institute.dto';

export class ApplicationFilterDto {
  @ApiProperty() @Expose() @IsEnum(Country) country: Country;
  @ApiProperty() @Expose() @IsEnum(Season) intake: Season;

  @ApiProperty()
  @Expose()
  @IsEnum(ApplicationStatus)
  applicationStatus: ApplicationStatus;

  @ApiProperty()
  @Expose()
  @IsEnum(AdmissionStatus)
  admissionStatus: AdmissionStatus;
}

export class PendingDocumentDto {
  @Expose() id: string;
  @Expose() name: string;
  @Expose() fileUrl: string;
}

export class ApplicationWithPendingDocumentsForStudentDto {
  @Expose() id: string;
  @Expose() country: Country;
  @Expose() educationalLevel: string;
  @Expose() fieldOfStudy: string;
  @Expose() applicationStatus: ApplicationStatus;
  @Expose() intake: Season;
  @Expose() admissionStatus: AdmissionStatus;
  @Expose() englishTestRequired: EnglishTestRequiredStatus;

  @Expose()
  @Type(() => PendingDocumentDto)
  pendingDocuments: PendingDocumentDto[];

  @Expose()
  @Type(() => StudentDto)
  student: StudentDto;
}

export class ApplicationWithPendingDocumentsDto {
  @Expose() id: string;
  @Expose() country: Country;
  @Expose() educationalLevel: string;
  @Expose() fieldOfStudy: string;
  @Expose() applicationStatus: ApplicationStatus;
  @Expose() institute: string;
  @Expose() intake: Season;
  @Expose() admissionStatus: AdmissionStatus;
  @Expose() englishTestRequired: EnglishTestRequiredStatus;
  @Expose() @Type(() => InstituteDto) institutes: InstituteDto[];

  @Expose()
  @Type(() => PendingDocumentDto)
  pendingDocuments: PendingDocumentDto[];

  @Expose()
  @Type(() => StudentDto)
  student: StudentDto;
}

export class ApplicationDto {
  @Expose() id: string;
  @Expose() country: Country;
  @Expose() educationalLevel: string;
  @Expose() fieldOfStudy: string;
  @Expose() applicationStatus: ApplicationStatus;
  @Expose() institute: string;
  @Expose() intake: Season;
  @Expose() englishTestRequired: EnglishTestRequiredStatus;
  @Expose() admissionStatus: AdmissionStatus;

  @Expose()
  @Type(() => StudentDto)
  student: StudentDto;
}
