import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  AdmissionCountsDto,
  ApplicationCountsDto,
  DepositCountsDto,
  EmployeeRoleCountDto,
  VisaCountsDto,
} from './dto';
import {
  AdmissionStatus,
  ApplicationStatus,
  Country,
  Gender,
  Role,
} from '@prisma/client';
import { GenderCountDto, StudentActiveStatusCountDto } from './dto/student.dto';

@Injectable()
export class DashboardService {
  constructor(private readonly database: PrismaService) {}

  async getApplicationCounts(): Promise<ApplicationCountsDto> {
    const applicationCounts = new ApplicationCountsDto();

    applicationCounts.depositStatus = await this.database.application.count({
      where: {
        applicationStatus: ApplicationStatus.Deposit,
      },
    });

    applicationCounts.admissionStatus = await this.database.application.count({
      where: {
        applicationStatus: ApplicationStatus.Admission,
      },
    });

    applicationCounts.visaStatus = await this.database.application.count({
      where: {
        applicationStatus: ApplicationStatus.Visa,
      },
    });

    applicationCounts.total = await this.database.application.count();

    return applicationCounts;
  }

  async getAdmissionCounts(): Promise<AdmissionCountsDto> {
    const admissionCounts = new AdmissionCountsDto();

    admissionCounts.admissionPending = await this.database.application.count({
      where: {
        applicationStatus: ApplicationStatus.Admission,
        admissionStatus: AdmissionStatus.Pending,
      },
    });

    admissionCounts.admissionApplying = await this.database.application.count({
      where: {
        applicationStatus: ApplicationStatus.Admission,
        admissionStatus: AdmissionStatus.Applying,
      },
    });

    admissionCounts.admissionRejected = await this.database.application.count({
      where: {
        applicationStatus: ApplicationStatus.Admission,
        admissionStatus: AdmissionStatus.Rejected,
      },
    });

    admissionCounts.admissionAccepted = await this.database.application.count({
      where: {
        applicationStatus: ApplicationStatus.Admission,
        admissionStatus: AdmissionStatus.Accepted,
      },
    });

    admissionCounts.total = await this.database.application.count({
      where: {
        applicationStatus: ApplicationStatus.Admission,
      },
    });

    return admissionCounts;
  }

  async getVisaCounts(): Promise<VisaCountsDto> {
    const visaCounts = new VisaCountsDto();

    visaCounts.us = await this.database.application.count({
      where: {
        applicationStatus: ApplicationStatus.Visa,
        country: Country.UnitedStates,
      },
    });

    visaCounts.canada = await this.database.application.count({
      where: {
        applicationStatus: ApplicationStatus.Visa,
        country: Country.Canada,
      },
    });

    visaCounts.italy = await this.database.application.count({
      where: {
        applicationStatus: ApplicationStatus.Visa,
        country: Country.Italy,
      },
    });

    visaCounts.hungary = await this.database.application.count({
      where: {
        applicationStatus: ApplicationStatus.Visa,
        country: Country.Hungary,
      },
    });

    visaCounts.total = await this.database.application.count({
      where: {
        applicationStatus: ApplicationStatus.Visa,
      },
    });

    return visaCounts;
  }

  async getDepositCounts(): Promise<DepositCountsDto> {
    const depositCounts = new DepositCountsDto();

    depositCounts.deposited = await this.database.deposit.count({
      where: {
        application: {
          applicationStatus: ApplicationStatus.Deposit,
        },
        isDeposited: true,
      },
    });

    depositCounts.blocked = await this.database.deposit.count({
      where: {
        application: {
          applicationStatus: ApplicationStatus.Deposit,
        },
        isBlocked: true,
      },
    });

    depositCounts.total = await this.database.deposit.count({
      where: {
        application: {
          applicationStatus: ApplicationStatus.Deposit,
        },
      },
    });

    return depositCounts;
  }

  async getStudentGenderCount(): Promise<GenderCountDto> {
    const studentGenderCount = new GenderCountDto();

    studentGenderCount.male = await this.database.user.count({
      where: {
        roles: {
          has: Role.Student,
        },
        gender: Gender.Male,
      },
    });

    studentGenderCount.female = await this.database.user.count({
      where: {
        roles: {
          has: Role.Student,
        },
        gender: Gender.Female,
      },
    });

    studentGenderCount.total = await this.database.user.count({
      where: {
        roles: {
          has: Role.Student,
        },
      },
    });

    return studentGenderCount;
  }

  async getStudentActiveStatusCount(): Promise<StudentActiveStatusCountDto> {
    const studentActiveStatusCount = new StudentActiveStatusCountDto();

    studentActiveStatusCount.active = await this.database.student.count({
      where: {
        isActive: true,
      },
    });

    studentActiveStatusCount.inactive = await this.database.student.count({
      where: {
        isActive: false,
      },
    });

    studentActiveStatusCount.total = await this.database.student.count();

    return studentActiveStatusCount;
  }

  async getEmployeeGenderCount(): Promise<GenderCountDto> {
    const employeeGenderCount = new GenderCountDto();

    employeeGenderCount.male = await this.database.user.count({
      where: {
        NOT: {
          roles: {
            has: Role.Student,
          },
        },
        gender: Gender.Male,
      },
    });

    employeeGenderCount.male = await this.database.user.count({
      where: {
        NOT: {
          roles: {
            has: Role.Student,
          },
        },
        gender: Gender.Female,
      },
    });

    employeeGenderCount.total = await this.database.user.count({
      where: {
        NOT: {
          roles: {
            has: Role.Student,
          },
        },
      },
    });

    return employeeGenderCount;
  }

  async getEmployeeRoleCount(): Promise<EmployeeRoleCountDto> {
    const employeeRoleCount = new EmployeeRoleCountDto();

    employeeRoleCount.admin = await this.database.user.count({
      where: {
        roles: {
          has: Role.Admin,
        },
      },
    });

    employeeRoleCount.agent = await this.database.user.count({
      where: {
        roles: {
          has: Role.Agent,
        },
      },
    });

    employeeRoleCount.admission = await this.database.user.count({
      where: {
        roles: {
          has: Role.Admission,
        },
      },
    });

    employeeRoleCount.finance = await this.database.user.count({
      where: {
        roles: {
          has: Role.Finance,
        },
      },
    });

    employeeRoleCount.visa = await this.database.user.count({
      where: {
        roles: {
          has: Role.Visa,
        },
      },
    });

    employeeRoleCount.total = await this.database.user.count({
      where: {
        NOT: {
          roles: {
            has: Role.Student,
          },
        },
      },
    });

    return employeeRoleCount;
  }
}
