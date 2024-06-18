import { Role } from '@prisma/client';
import { Expose, Type } from 'class-transformer';
import { StudentDto } from '../../base/dto';

export class EmployeeDto {
  @Expose() id: string;
  @Expose() firstName: string;
  @Expose() lastName: string;
  @Expose() studentAssignmentCount: number;
}

export class BasicEmployeeUserDto {
  @Expose() id: string;
  @Expose() firstName: string;
  @Expose() lastName: string;
  @Expose() roles: Role[];
}

export class CalendarEmployeeUserDto {
  @Expose() id: string;
  @Expose() access_token: string;
  @Expose() @Type(() => EmployeeDto) employee: EmployeeDto;
}

export class EmployeeUserDto {
  @Expose() id: string;
  @Expose() email: string;
  @Expose() firstName: string;
  @Expose() lastName: string;
  @Expose() phoneNumber: string;
  @Expose() roles: Role[];
  @Expose() access_token: string;
  @Expose() @Type(() => EmployeeDto) employee: EmployeeDto;
}

export class StudentUserDto {
  @Expose() id: string;
  @Expose() email: string;
  @Expose() firstName: string;
  @Expose() lastName: string;
  @Expose() phoneNumber: string;
  @Expose() roles: Role[];
  @Expose() @Type(() => StudentDto) student: StudentDto;
}
