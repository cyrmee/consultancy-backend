import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiQuery, ApiTags } from '@nestjs/swagger';
import {
  AdmissionStatus,
  ApplicationStatus,
  Country,
  Role,
  Season,
} from '@prisma/client';
import { GetUser, Roles } from '../auth/decorator';
import { JwtGuard, RolesGuard } from '../auth/guard';
import { ApplicationService } from './application.service';
import {
  ApplicationWithPendingDocumentsDto,
  CreateApplicationDto,
  CreatePendingDocumentDto,
  EditApplicationDto,
  EditPendingDocument,
  ApplicationFilterDto,
  PendingDocumentDto,
  ApplicationWithPendingDocumentsForStudentDto,
  InstituteDto,
  CreateInstituteDto,
  EditInstituteDto,
} from './dto';
import { EmployeeUserDto } from '../auth/dto';

@ApiBearerAuth()
@ApiTags('applications')
@UseGuards(JwtGuard, RolesGuard)
@Roles(Role.Admin, Role.Agent, Role.Admission, Role.Finance, Role.Visa)
@Controller('applications')
export class ApplicationController {
  constructor(private readonly applicationService: ApplicationService) {}

  @Get()
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.Admin)
  @ApiQuery({ name: 'country', required: false, type: String })
  @ApiQuery({ name: 'intake', required: false, type: String })
  @ApiQuery({ name: 'applicationStatus', required: false, type: String })
  @ApiQuery({ name: 'admissionStatus', required: false, type: String })
  @ApiQuery({ name: 'query', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  async queryApplications(
    @Query('country') country?: Country,
    @Query('intake') intake?: Season,
    @Query('applicationStatus') applicationStatus?: ApplicationStatus,
    @Query('admissionStatus') admissionStatus?: AdmissionStatus,
    @Query('query') query?: string,
    @Query('page') page: number = 1,
    @Query('pageSize') pageSize: number = 15,
  ): Promise<{
    applications: ApplicationWithPendingDocumentsDto[];
    totalCount: number;
    pages: number;
  }> {
    const filter: ApplicationFilterDto = {
      country: country,
      intake: intake,
      applicationStatus: applicationStatus,
      admissionStatus: admissionStatus,
    };
    return await this.applicationService.queryApplications(
      filter,
      query,
      typeof page === 'string' ? parseInt(page) : page,
      typeof pageSize === 'string' ? parseInt(pageSize) : pageSize,
    );
  }

  @Get('employee')
  @ApiQuery({ name: 'country', required: false, type: String })
  @ApiQuery({ name: 'intake', required: false, type: String })
  @ApiQuery({ name: 'applicationStatus', required: false, type: String })
  @ApiQuery({ name: 'admissionStatus', required: false, type: String })
  @ApiQuery({ name: 'query', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  async queryApplicationsByLoggedInEmployee(
    @GetUser() user: EmployeeUserDto,
    @Query('country') country?: Country,
    @Query('intake') intake?: Season,
    @Query('applicationStatus') applicationStatus?: ApplicationStatus,
    @Query('admissionStatus') admissionStatus?: AdmissionStatus,
    @Query('query') query?: string,
    @Query('page') page: number = 1,
    @Query('pageSize') pageSize: number = 15,
  ): Promise<{
    applications: ApplicationWithPendingDocumentsDto[];
    totalCount: number;
    pages: number;
  }> {
    const filter: ApplicationFilterDto = {
      country: country,
      intake: intake,
      applicationStatus: applicationStatus,
      admissionStatus: admissionStatus,
    };
    return await this.applicationService.queryApplicationsByLoggedInEmployee(
      filter,
      query,
      user,
      typeof page === 'string' ? parseInt(page) : page,
      typeof pageSize === 'string' ? parseInt(pageSize) : pageSize,
    );
  }

  @Get('student/:studentId')
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  async getApplicationsPerStudent(
    @Param('studentId') studentId: string,
    @Query('page') page: number = 1,
    @Query('pageSize') pageSize: number = 15,
  ): Promise<{
    applications: ApplicationWithPendingDocumentsDto[];
    totalCount: number;
    pages: number;
  }> {
    return await this.applicationService.getApplicationsByStudent(
      studentId,
      typeof page === 'string' ? parseInt(page) : page,
      typeof pageSize === 'string' ? parseInt(pageSize) : pageSize,
    );
  }

  @Get('student')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.Student)
  async getApplicationForLoggedInStudent(
    @GetUser('id') userId: string,
  ): Promise<ApplicationWithPendingDocumentsForStudentDto[]> {
    return await this.applicationService.getApplicationForLoggedInStudent(
      userId,
    );
  }

  @Get('details/:applicationId')
  async getApplication(
    @Param('applicationId') applicationId: string,
  ): Promise<ApplicationWithPendingDocumentsDto> {
    return await this.applicationService.getApplicationById(applicationId);
  }

  @Get('institute/:applicationId')
  async getInstitutes(
    @Param('applicationId') applicationId: string,
  ): Promise<InstituteDto[]> {
    return await this.applicationService.getInstitutes(applicationId);
  }

  @Get('student/details/:applicationId')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.Student)
  async getApplicationByIdForLoggedInStudent(
    @Param('applicationId') applicationId: string,
    @GetUser('id') userId: string,
  ): Promise<ApplicationWithPendingDocumentsDto> {
    return await this.applicationService.getApplicationByIdForLoggedInStudent(
      userId,
      applicationId,
    );
  }

  @Get('pendingDocuments/:applicationId')
  async getPendingDocuments(
    @Param('applicationId') applicationId: string,
  ): Promise<PendingDocumentDto[]> {
    return await this.applicationService.getPendingDocuments(applicationId);
  }

  @Get('pendingDocument/:pendingDocumentId')
  async getPendingDocumentById(
    @Param('pendingDocumentId') pendingDocumentId: string,
  ): Promise<PendingDocumentDto> {
    return await this.applicationService.getPendingDocumentById(
      pendingDocumentId,
    );
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiBody({ type: () => CreateApplicationDto })
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.Admin, Role.Agent)
  async createApplication(
    @Body() createApplicationDto: CreateApplicationDto,
    @GetUser() user: EmployeeUserDto,
  ): Promise<void> {
    await this.applicationService.createApplication(createApplicationDto, user);
  }

  @Post('institute')
  @HttpCode(HttpStatus.CREATED)
  @ApiBody({ type: () => CreateInstituteDto })
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.Admin, Role.Admission)
  async createInstitute(
    @Body() createInstituteDto: CreateInstituteDto,
  ): Promise<void> {
    await this.applicationService.createInstitute(createInstituteDto);
  }

  @Post('pendingDocument')
  @HttpCode(HttpStatus.CREATED)
  @ApiBody({ type: () => CreatePendingDocumentDto })
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.Admin, Role.Agent)
  async createPendingDocument(
    @Body() createPendingDocumentDto: CreatePendingDocumentDto,
    @GetUser() user: EmployeeUserDto,
  ) {
    await this.applicationService.createPendingDocument(
      createPendingDocumentDto,
      user,
    );
  }

  @Patch()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBody({ type: () => EditApplicationDto })
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.Admin, Role.Agent)
  async editApplication(
    @Body() editApplicationDto: EditApplicationDto,
    @GetUser() user: EmployeeUserDto,
  ): Promise<void> {
    await this.applicationService.editApplication(editApplicationDto, user);
  }

  // @Patch('english-test-requirement')
  @Patch('editEnglishTestRequired')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBody({ type: () => EditApplicationDto })
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.Admin, Role.Admission)
  async editEnglishTestRequirement(
    @Body() editApplicationDto: EditApplicationDto,
    @GetUser() user: EmployeeUserDto,
  ): Promise<void> {
    await this.applicationService.editEnglishTestRequirement(
      editApplicationDto,
      user,
    );
  }

  @Patch('institute')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBody({ type: () => EditInstituteDto })
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.Admin, Role.Admission)
  async editInstitute(
    @Body() editInstituteDto: EditInstituteDto,
  ): Promise<void> {
    await this.applicationService.editInstitute(editInstituteDto);
  }

  @Patch('admissionStatus')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBody({ type: () => EditApplicationDto })
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.Admin, Role.Admission)
  async editApplicationAdmissionStatus(
    @Body() editApplicationDto: EditApplicationDto,
    @GetUser() user: EmployeeUserDto,
  ): Promise<void> {
    await this.applicationService.editApplicationAdmissionStatus(
      editApplicationDto,
      user,
    );
  }

  @Patch('pendingDocument')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBody({ type: () => EditPendingDocument })
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.Admin, Role.Agent)
  async editPendingDocument(
    @Body() editPendingDocument: EditPendingDocument,
    @GetUser() user: EmployeeUserDto,
  ) {
    await this.applicationService.editPendingDocument(
      editPendingDocument,
      user,
    );
  }

  @Delete(':applicationId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.Admin, Role.Agent)
  async deleteApplication(
    @Param('applicationId') applicationId: string,
    @GetUser() user: EmployeeUserDto,
  ): Promise<void> {
    await this.applicationService.deleteApplication(applicationId, user);
  }

  @Delete('pendingDocument/:pendingDocumentId')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.Admin, Role.Agent)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deletePendingDocument(
    @Param('pendingDocumentId') pendingDocumentId: string,
    @GetUser() user: EmployeeUserDto,
  ) {
    await this.applicationService.deletePendingDocument(
      pendingDocumentId,
      user,
    );
  }

  @Delete('institute/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.Admin, Role.Admission)
  async deleteInstitute(@Param('id') id: string): Promise<void> {
    await this.applicationService.deleteInstitute(id);
  }
}
