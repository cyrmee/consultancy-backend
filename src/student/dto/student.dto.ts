import { Country, Gender, Relationship, Season } from '@prisma/client';
import { Expose, Type } from 'class-transformer';
import { UserDto } from '../../user/dto';
import { EducationBackgroundDto } from '../../education-background/dto';
import { ApplicationDto, EmployeeDto } from '../../base/dto';
import { AdditionalStudentFilesDto } from '../../additional-student-files/dto';

export class StudentFilterDto {
  @Expose() gender?: Gender;
  @Expose() country?: Country;
  @Expose() intake?: Season;
  @Expose() isActive?: boolean;
}

export class StudentAddressDto {
  @Expose() region: string;
  @Expose() city?: string;
  @Expose() subCity?: string;
  @Expose() woreda?: string;
  @Expose() kebele?: string;
  @Expose() houseNumber: string;
}

export class StudentRelationsDto {
  @Expose() id: string;
  @Expose() firstName: string;
  @Expose() lastName: string;
  @Expose() phoneNumber?: string;
  @Expose() educationalLevel?: string;
  @Expose() dateOfBirth?: Date;
  @Expose() relationship: Relationship;
}

export class PassportDto {
  @Expose() passportNumber: string;
  @Expose() issueDate: Date;
  @Expose() expiryDate: Date;
  @Expose() passportAttachment?: string;
}

export class StudentWithoutApplicationDto {
  @Expose() id: string;
  @Expose() firstName: string;
  @Expose() lastName: string;
  @Expose() gender: Gender;
  @Expose() dateOfBirth?: Date;
  @Expose() admissionEmail: string;
  @Expose() branch: string;
  @Expose() isActive: boolean;
  @Expose() image?: string;
  @Expose() passportNumber: string;
  @Expose() issueDate: Date;
  @Expose() expiryDate: Date;
  @Expose() passportAttachment?: string;
  @Expose() @Type(() => EmployeeDto) agent: EmployeeDto;
  @Expose() @Type(() => StudentAddressDto) studentAddress: StudentAddressDto;

  @Expose()
  @Type(() => StudentRelationsDto)
  studentRelations: StudentRelationsDto[];

  @Expose()
  @Type(() => EducationBackgroundDto)
  educationBackgrounds: EducationBackgroundDto[];

  @Expose() @Type(() => UserDto) user: UserDto;

  @Expose()
  @Type(() => AdditionalStudentFilesDto)
  additionalStudentFiles: AdditionalStudentFilesDto[];
}

export class FutureStudentInfoDto {
  @Expose() level: string;
  @Expose() country: Country;
  @Expose() field: string;
}

export class NonClientStudentDto {
  @Expose() id: string;
  @Expose() firstName: string;
  @Expose() lastName: string;
  @Expose() gender: Gender;
  @Expose() dateOfBirth?: Date;
  @Expose() admissionEmail: string;
  @Expose() branch: string;
  @Expose() isActive: boolean;
  @Expose() image?: string;
  @Expose() passportNumber: string;
  @Expose() issueDate: Date;
  @Expose() expiryDate: Date;
  @Expose() passportAttachment?: string;
  @Expose() @Type(() => StudentAddressDto) studentAddress: StudentAddressDto;

  @Expose() @Type(() => UserDto) user: UserDto;

  @Expose()
  @Type(() => FutureStudentInfoDto)
  futureStudentInfo: FutureStudentInfoDto;
}

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
  @Expose() passportNumber: string;
  @Expose() issueDate: Date;
  @Expose() expiryDate: Date;
  @Expose() passportAttachment?: string;
  @Expose() @Type(() => EmployeeDto) agent: EmployeeDto;
  @Expose() @Type(() => StudentAddressDto) studentAddress: StudentAddressDto;

  @Expose()
  @Type(() => StudentRelationsDto)
  studentRelations: StudentRelationsDto[];

  @Expose()
  @Type(() => EducationBackgroundDto)
  educationBackgrounds: EducationBackgroundDto[];

  @Expose() @Type(() => ApplicationDto) applications: ApplicationDto[];
  @Expose() @Type(() => UserDto) user: UserDto;

  @Expose()
  @Type(() => AdditionalStudentFilesDto)
  additionalStudentFiles: AdditionalStudentFilesDto[];
}
