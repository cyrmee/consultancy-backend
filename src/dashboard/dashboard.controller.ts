import { Controller, Get, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import {
  ApplicationCountsDto,
  AdmissionCountsDto,
  DepositCountsDto,
  GenderCountDto,
  StudentActiveStatusCountDto,
  EmployeeRoleCountDto,
  VisaCountsDto,
} from './dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../auth/decorator';
import { JwtGuard, RolesGuard } from '../auth/guard';

@ApiBearerAuth()
@UseGuards(JwtGuard, RolesGuard)
@Roles(Role.Admin, Role.Agent, Role.Admission, Role.Finance, Role.Visa)
@ApiTags('dashboard')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('applicationCount')
  async getApplicationCounts(): Promise<ApplicationCountsDto> {
    return this.dashboardService.getApplicationCounts();
  }

  @Get('admissionCount')
  async getAdmissionCounts(): Promise<AdmissionCountsDto> {
    return this.dashboardService.getAdmissionCounts();
  }

  @Get('depositCount')
  async getDepositCounts(): Promise<DepositCountsDto> {
    return this.dashboardService.getDepositCounts();
  }

  @Get('visaCounts')
  async getVisaCounts(): Promise<VisaCountsDto> {
    return this.dashboardService.getVisaCounts();
  }

  @Get('studentGenderCount')
  async getStudentGenderCount(): Promise<GenderCountDto> {
    return this.dashboardService.getStudentGenderCount();
  }

  @Get('studentActiveStatusCount')
  async getStudentActiveStatusCount(): Promise<StudentActiveStatusCountDto> {
    return this.dashboardService.getStudentActiveStatusCount();
  }

  @Get('employeeGenderCount')
  async getEmployeeGenderCount(): Promise<GenderCountDto> {
    return this.dashboardService.getEmployeeGenderCount();
  }

  @Get('employeeRoleCount')
  async getEmployeeRoleCount(): Promise<EmployeeRoleCountDto> {
    return this.dashboardService.getEmployeeRoleCount();
  }
}
