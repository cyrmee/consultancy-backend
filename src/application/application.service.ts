import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  ApplicationDto,
  ApplicationWithPendingDocumentsDto,
  CreateApplicationDto,
  CreatePendingDocumentDto,
  EditApplicationDto,
  EditPendingDocument,
  ApplicationFilterDto as ApplicationFilterDto,
  PendingDocumentDto,
  ApplicationWithPendingDocumentsForStudentDto,
  InstituteDto,
  CreateInstituteDto,
  EditInstituteDto,
} from './dto';
import { plainToInstance } from 'class-transformer';
import {
  AdmissionStatus,
  ApplicationStatus,
  CanadaVisaApplicationStatus,
  Country,
  EnglishTestRequiredStatus,
  EventCategory,
  Operation,
  PaymentStatus,
  Role,
  Season,
  UnitedStatesVisaApplicationStatus,
  VisaPaymentStatus,
} from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { IsEnum, IsString, validate } from 'class-validator';
import { CalendarColor } from '../common/enums';
import { CreateNotificationDto } from '../notification/dto';
import { NotificationService } from '../notification/notification.service';
import { CalendarService } from '../calendar/calendar.service';
import { CreateCalendarDto } from '../calendar/dto';
import { EmployeeUserDto } from '../auth/dto';
import { UserDto } from '../user/dto';

@Injectable()
export class ApplicationService {
  constructor(
    private readonly database: PrismaService,
    private readonly auditService: AuditService,
    private readonly notificationService: NotificationService,
    private readonly calendarService: CalendarService,
  ) {}

  private async validateType(fieldName: string, value: string, enumType: any) {
    class Dto {
      @IsString()
      @IsEnum(enumType)
      value: any;
    }
    const dto = new Dto();
    dto.value = value as any;

    const errors = await validate(dto);
    if (errors.length > 0) {
      throw new BadRequestException(
        `${fieldName} ${errors[0].constraints.isEnum}`,
      );
    }
  }

  async queryApplications(
    filter: ApplicationFilterDto,
    query: string,
    page: number = 1,
    pageSize: number = 15,
  ): Promise<{
    applications: ApplicationWithPendingDocumentsDto[];
    totalCount: number;
    pages: number;
  }> {
    try {
      if (filter.country) {
        await this.validateType('country', filter.country, Country);
      }
      if (filter.intake) {
        await this.validateType('intake', filter.intake, Season);
      }
      if (filter.admissionStatus) {
        await this.validateType(
          'admissionStatus',
          filter.admissionStatus,
          AdmissionStatus,
        );
      }
      if (filter.applicationStatus) {
        await this.validateType(
          'applicationStatus',
          filter.applicationStatus,
          ApplicationStatus,
        );
      }

      const sizeCount = (page - 1) * pageSize;
      const applications = await this.database.application.findMany({
        where: {
          AND: [
            filter.country ? { country: filter.country as Country } : {},
            filter.intake ? { intake: filter.intake as Season } : {},
            filter.admissionStatus
              ? { admissionStatus: filter.admissionStatus as AdmissionStatus }
              : {},
            filter.applicationStatus
              ? {
                  applicationStatus:
                    filter.applicationStatus as ApplicationStatus,
                }
              : {},
            query
              ? {
                  OR: [
                    {
                      educationalLevel: {
                        contains: query,
                        mode: 'insensitive',
                      },
                    },
                    {
                      fieldOfStudy: {
                        contains: query,
                        mode: 'insensitive',
                      },
                    },
                    {
                      institutes: {
                        some: {
                          name: { contains: query, mode: 'insensitive' },
                        },
                      },
                    },
                    {
                      student: {
                        OR: [
                          {
                            firstName: { contains: query, mode: 'insensitive' },
                          },
                          {
                            lastName: { contains: query, mode: 'insensitive' },
                          },
                          {
                            user: {
                              OR: [
                                {
                                  email: {
                                    contains: query,
                                    mode: 'insensitive',
                                  },
                                },
                                {
                                  phoneNumber: {
                                    contains: query,
                                    mode: 'insensitive',
                                  },
                                },
                              ],
                            },
                          },
                        ],
                      },
                    },
                  ],
                }
              : {},
          ],
        },
        include: {
          pendingDocuments: true,
          visa: true,
          finance: true,
          admission: true,
          student: true,
          institutes: true,
        },
        skip: sizeCount,
        take: pageSize,
        orderBy: { updatedAt: 'desc' },
      });

      const totalCount = await this.database.application.count({
        where: {
          AND: [
            filter.country ? { country: filter.country as Country } : {},
            filter.intake ? { intake: filter.intake as Season } : {},
            filter.admissionStatus
              ? { admissionStatus: filter.admissionStatus as AdmissionStatus }
              : {},
            filter.applicationStatus
              ? {
                  applicationStatus:
                    filter.applicationStatus as ApplicationStatus,
                }
              : {},
            query
              ? {
                  OR: [
                    {
                      educationalLevel: {
                        contains: query,
                        mode: 'insensitive',
                      },
                    },
                    {
                      fieldOfStudy: {
                        contains: query,
                        mode: 'insensitive',
                      },
                    },
                    {
                      institutes: {
                        some: {
                          name: { contains: query, mode: 'insensitive' },
                        },
                      },
                    },
                    {
                      student: {
                        OR: [
                          {
                            firstName: { contains: query, mode: 'insensitive' },
                          },
                          {
                            lastName: { contains: query, mode: 'insensitive' },
                          },
                          {
                            user: {
                              OR: [
                                {
                                  email: {
                                    contains: query,
                                    mode: 'insensitive',
                                  },
                                },
                                {
                                  phoneNumber: {
                                    contains: query,
                                    mode: 'insensitive',
                                  },
                                },
                              ],
                            },
                          },
                        ],
                      },
                    },
                  ],
                }
              : {},
          ],
        },
      });

      return {
        applications: plainToInstance(
          ApplicationWithPendingDocumentsDto,
          applications,
          {
            excludeExtraneousValues: true,
          },
        ),
        totalCount: totalCount,
        pages: Math.ceil(totalCount / pageSize),
      };
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async queryApplicationsByLoggedInEmployee(
    filter: ApplicationFilterDto,
    query: string,
    user: EmployeeUserDto,
    page: number = 1,
    pageSize: number = 15,
  ): Promise<{
    applications: ApplicationWithPendingDocumentsDto[];
    totalCount: number;
    pages: number;
  }> {
    try {
      if (filter.country) {
        await this.validateType('country', filter.country, Country);
      }
      if (filter.intake) {
        await this.validateType('intake', filter.intake, Season);
      }
      if (filter.admissionStatus) {
        await this.validateType(
          'admissionStatus',
          filter.admissionStatus,
          AdmissionStatus,
        );
      }
      if (filter.applicationStatus) {
        await this.validateType(
          'applicationStatus',
          filter.applicationStatus,
          ApplicationStatus,
        );
      }

      const skipCount = (page - 1) * pageSize;
      const applications = await this.database.application.findMany({
        where: {
          AND: [
            filter.country ? { country: filter.country as Country } : {},
            filter.intake ? { intake: filter.intake as Season } : {},
            filter.admissionStatus
              ? { admissionStatus: filter.admissionStatus as AdmissionStatus }
              : {},
            filter.applicationStatus
              ? {
                  applicationStatus:
                    filter.applicationStatus as ApplicationStatus,
                }
              : {},
            query
              ? {
                  OR: [
                    {
                      educationalLevel: {
                        contains: query,
                        mode: 'insensitive',
                      },
                    },
                    {
                      fieldOfStudy: {
                        contains: query,
                        mode: 'insensitive',
                      },
                    },
                    {
                      institutes: {
                        some: {
                          name: { contains: query, mode: 'insensitive' },
                        },
                      },
                    },
                    {
                      student: {
                        OR: [
                          {
                            firstName: { contains: query, mode: 'insensitive' },
                          },
                          {
                            lastName: { contains: query, mode: 'insensitive' },
                          },
                          {
                            user: {
                              OR: [
                                {
                                  email: {
                                    contains: query,
                                    mode: 'insensitive',
                                  },
                                },
                                {
                                  phoneNumber: {
                                    contains: query,
                                    mode: 'insensitive',
                                  },
                                },
                              ],
                            },
                          },
                        ],
                      },
                    },
                  ],
                }
              : {},
            {
              OR: [
                { visaId: user.employee.id },
                { financeId: user.employee.id },
                { admissionId: user.employee.id },
              ],
            },
          ],
        },
        include: {
          pendingDocuments: true,
          student: true,
          visa: true,
          finance: true,
          admission: true,
          institutes: true,
        },
        skip: skipCount,
        take: pageSize,
        orderBy: { updatedAt: 'desc' },
      });

      const totalCount = await this.database.application.count({
        where: {
          AND: [
            filter.country ? { country: filter.country as Country } : {},
            filter.intake ? { intake: filter.intake as Season } : {},
            filter.admissionStatus
              ? { admissionStatus: filter.admissionStatus as AdmissionStatus }
              : {},
            filter.applicationStatus
              ? {
                  applicationStatus:
                    filter.applicationStatus as ApplicationStatus,
                }
              : {},
            query
              ? {
                  OR: [
                    {
                      educationalLevel: {
                        contains: query,
                        mode: 'insensitive',
                      },
                    },
                    {
                      fieldOfStudy: {
                        contains: query,
                        mode: 'insensitive',
                      },
                    },
                    {
                      institutes: {
                        some: {
                          name: { contains: query, mode: 'insensitive' },
                        },
                      },
                    },
                    {
                      student: {
                        OR: [
                          {
                            firstName: { contains: query, mode: 'insensitive' },
                          },
                          {
                            lastName: { contains: query, mode: 'insensitive' },
                          },
                          {
                            user: {
                              OR: [
                                {
                                  email: {
                                    contains: query,
                                    mode: 'insensitive',
                                  },
                                },
                                {
                                  phoneNumber: {
                                    contains: query,
                                    mode: 'insensitive',
                                  },
                                },
                              ],
                            },
                          },
                        ],
                      },
                    },
                  ],
                }
              : {},
            {
              OR: [
                { visaId: user.employee.id },
                { financeId: user.employee.id },
                { admissionId: user.employee.id },
              ],
            },
          ],
        },
      });

      return {
        applications: plainToInstance(
          ApplicationWithPendingDocumentsDto,
          applications,
          {
            excludeExtraneousValues: true,
          },
        ),
        totalCount: totalCount,
        pages: Math.ceil(totalCount / pageSize),
      };
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async getApplicationsByStudent(
    studentId: string,
    page: number = 1,
    pageSize: number = 15,
  ): Promise<{
    applications: ApplicationWithPendingDocumentsDto[];
    totalCount: number;
    pages: number;
  }> {
    try {
      const skipCount = (page - 1) * pageSize;
      const applications = await this.database.application.findMany({
        where: { studentId: studentId },
        include: {
          pendingDocuments: true,
          institutes: true,
        },
        skip: skipCount,
        take: pageSize,
        orderBy: { updatedAt: 'desc' },
      });

      const totalCount = await this.database.application.count({
        where: { studentId: studentId },
      });

      return {
        applications: plainToInstance(
          ApplicationWithPendingDocumentsDto,
          applications,
          {
            excludeExtraneousValues: true,
          },
        ),
        totalCount: totalCount,
        pages: Math.ceil(totalCount / pageSize),
      };
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async getApplicationForLoggedInStudent(
    userId: string,
  ): Promise<ApplicationWithPendingDocumentsForStudentDto[]> {
    try {
      const user = await this.database.user.findUnique({
        where: { id: userId, roles: { has: Role.Student } },
        include: {
          student: { where: { isActive: true } },
        },
      });

      if (!user || !user.student)
        throw new NotFoundException(`User with ID ${userId} not found.`);

      const applications = await this.database.application.findMany({
        where: { studentId: user.student.id },
        include: {
          pendingDocuments: true,
        },
        orderBy: { updatedAt: 'desc' },
      });

      return plainToInstance(
        ApplicationWithPendingDocumentsForStudentDto,
        applications,
        {
          excludeExtraneousValues: true,
        },
      );
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async getApplicationById(
    applicationId: string,
  ): Promise<ApplicationWithPendingDocumentsDto> {
    try {
      const application = await this.database.application.findUnique({
        where: { id: applicationId },
        include: {
          pendingDocuments: true,
          institutes: true,
        },
      });

      if (!application)
        throw new NotFoundException(
          `Application with ID ${applicationId} not found.`,
        );

      return plainToInstance(ApplicationWithPendingDocumentsDto, application, {
        excludeExtraneousValues: true,
      });
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async getApplicationByIdForLoggedInStudent(
    userId: string,
    applicationId: string,
  ): Promise<ApplicationWithPendingDocumentsDto> {
    try {
      const user = await this.database.user.findUnique({
        where: { id: userId, roles: { has: Role.Student } },
        include: {
          student: { where: { isActive: true } },
        },
      });

      if (!user || !user.student)
        throw new NotFoundException(`User with ID ${userId} not found.`);

      const application = await this.database.application.findUnique({
        where: { id: applicationId, studentId: user.student.id },
        include: {
          pendingDocuments: true,
        },
      });

      if (!application)
        throw new NotFoundException(
          `Application with ID ${applicationId} not found.`,
        );

      return plainToInstance(ApplicationWithPendingDocumentsDto, application, {
        excludeExtraneousValues: true,
      });
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async getPendingDocuments(
    applicationId: string,
  ): Promise<PendingDocumentDto[]> {
    try {
      const application = await this.database.application.findUnique({
        where: { id: applicationId },
        include: {
          student: true,
        },
      });

      if (!application)
        throw new NotFoundException(
          `Application with ID ${applicationId} not found.`,
        );

      const pendingDocuments = await this.database.pendingDocument.findMany({
        where: {
          applicationId: applicationId,
        },
        orderBy: { updatedAt: 'desc' },
      });

      return plainToInstance(PendingDocumentDto, pendingDocuments, {
        excludeExtraneousValues: true,
      });
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async getPendingDocumentById(
    pendingDocumentId: string,
  ): Promise<PendingDocumentDto> {
    try {
      const pendingDocument = await this.database.pendingDocument.findUnique({
        where: {
          id: pendingDocumentId,
        },
      });

      if (!pendingDocument)
        throw new NotFoundException(
          `Pending document with ID ${pendingDocumentId} not found.`,
        );

      return plainToInstance(PendingDocumentDto, pendingDocument, {
        excludeExtraneousValues: true,
      });
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async getInstitutes(applicationId: string): Promise<InstituteDto[]> {
    try {
      const application = await this.database.application.findUnique({
        where: { id: applicationId },
      });

      if (!application)
        throw new NotFoundException(
          `Application with ID ${applicationId} not found.`,
        );

      const institutes = await this.database.institute.findMany({
        where: { applicationId: applicationId },
      });

      return plainToInstance(InstituteDto, institutes, {
        excludeExtraneousValues: true,
      });
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async createApplication(
    createApplicationDto: CreateApplicationDto,
    user: EmployeeUserDto,
  ): Promise<void> {
    try {
      await this.database.$transaction(async () => {
        const student = await this.database.student.findUnique({
          where: {
            id: createApplicationDto.studentId,
          },
        });

        if (!student)
          throw new NotFoundException(
            `Student with ID ${createApplicationDto.studentId} not found. `,
          );

        if (!student.isActive)
          throw new BadRequestException('Student is not active.');

        const visa = await this.database.employee.findFirst({
          where: {
            user: {
              roles: { has: Role.Visa },
            },
            applicationAssignmentCount: { gte: 0 },
            isSuspended: false,
          },
          orderBy: { applicationAssignmentCount: 'asc' },
        });

        if (!visa) throw new BadRequestException('No visa officer found.');

        const finance = await this.database.employee.findFirst({
          where: {
            user: {
              roles: { has: Role.Finance },
            },
            applicationAssignmentCount: { gte: 0 },
            isSuspended: false,
          },
          orderBy: { applicationAssignmentCount: 'asc' },
        });

        if (!finance) throw new BadRequestException('No visa finance found.');

        const admission = await this.database.employee.findFirst({
          where: {
            user: {
              roles: { has: Role.Admission },
            },
            applicationAssignmentCount: { gte: 0 },
            isSuspended: false,
          },
          orderBy: { applicationAssignmentCount: 'asc' },
        });

        if (!admission)
          throw new BadRequestException('No admission officer found.');

        const expirationDate = Date.now() + 9 * 24 * 60 * 60 * 1000;
        const application = await this.database.application.create({
          data: {
            country: createApplicationDto.country,
            educationalLevel: createApplicationDto.educationalLevel,
            fieldOfStudy: createApplicationDto.fieldOfStudy,
            intake: createApplicationDto.intake,
            visa: {
              connect: { id: visa.id },
            },
            finance: {
              connect: { id: finance.id },
            },
            admission: {
              connect: { id: admission.id },
            },
            deposit: {
              create: {
                status: PaymentStatus.Pending,
                isDeposited: false,
                isBlocked: false,
                expiration: new Date(expirationDate),
              },
            },
            student: {
              connect: {
                id: createApplicationDto.studentId,
              },
            },
          },
        });

        await this.database.employee.update({
          where: { id: visa.id },
          data: {
            applicationAssignmentCount: visa.applicationAssignmentCount + 1,
          },
        });

        await this.database.employee.update({
          where: { id: finance.id },
          data: {
            applicationAssignmentCount: finance.applicationAssignmentCount + 1,
          },
        });

        await this.database.employee.update({
          where: { id: admission.id },
          data: {
            applicationAssignmentCount:
              admission.applicationAssignmentCount + 1,
          },
        });

        if (application.country === Country.UnitedStates)
          await this.database.unitedStatesVisa.create({
            data: {
              visaApplicationStatus: UnitedStatesVisaApplicationStatus.Pending,
              visaFeePaymentStatus: VisaPaymentStatus.Unpaid,
              sevisPaymentStatus: VisaPaymentStatus.Unpaid,
              application: {
                connect: { id: application.id },
              },
            },
          });

        if (application.country !== Country.UnitedStates)
          await this.database.canadaVisa.create({
            data: {
              visaApplicationAndBiometricFee: VisaPaymentStatus.Unpaid,
              visaApplicationStatus: CanadaVisaApplicationStatus.Pending,
              application: {
                connect: { id: application.id },
              },
            },
          });

        await this.auditService.createAudit({
          entity: 'Application',
          operation: Operation.Create,
          recordId: application.id,
          userId: user.id,
          previousValues: null,
        });

        const createCalendarDto = new CreateCalendarDto();
        createCalendarDto.startDate = new Date(expirationDate);
        createCalendarDto.endDate = new Date(expirationDate);
        createCalendarDto.externalId = `Deposit-${application.id}`;
        createCalendarDto.title = `Deposit (${student.firstName} ${student.lastName})`;
        createCalendarDto.description = `Application Country: ${application.country}\nField of Study: ${application.fieldOfStudy} \nEducational Level: ${application.educationalLevel}`;
        createCalendarDto.eventCategory = EventCategory.Finance;
        createCalendarDto.color = CalendarColor.Deposit;
        createCalendarDto.applicationId = application.id;
        createCalendarDto.employeeId = finance.id;
        createCalendarDto.googleColor = CalendarColor.DepositGoogle;

        const employee = await this.database.employee.findUnique({
          where: {
            id: finance.id,
          },
          include: {
            user: true,
          },
        });

        await this.calendarService.createCalendar(
          createCalendarDto,
          plainToInstance(UserDto, employee.user, {
            excludeExtraneousValues: true,
          }),
        );
      });
    } catch (error) {
      console.error(error);
      if (error.code === 'P2002')
        throw new BadRequestException(`${error.meta.target} already exists`);
      else if (error.code === 'P2025')
        throw new BadRequestException(`${error.meta.cause}`);
      throw error;
    }
  }

  async createPendingDocument(
    createPendingDocumentDto: CreatePendingDocumentDto,
    user: EmployeeUserDto,
  ): Promise<void> {
    try {
      const application = await this.database.application.findUnique({
        where: {
          id: createPendingDocumentDto.applicationId,
        },
      });

      if (!application)
        throw new NotFoundException(
          `Application with ID ${createPendingDocumentDto.applicationId} not found.`,
        );

      await this.database.$transaction(async () => {
        await this.database.pendingDocument.create({
          data: {
            name: createPendingDocumentDto.name,
            fileUrl: 'to be added in the future',
            application: {
              connect: {
                id: createPendingDocumentDto.applicationId,
              },
            },
          },
        });

        await this.auditService.createAudit({
          entity: 'Pending Documents',
          operation: Operation.Create,
          recordId: application.id,
          userId: user.id,
          previousValues: null,
        });
      });
    } catch (error) {
      console.error(error);
      if (error.code === 'P2002')
        throw new BadRequestException(`${error.meta.target} already exists`);
      else if (error.code === 'P2025')
        throw new BadRequestException(`${error.meta.cause}`);
      throw error;
    }
  }

  async createInstitute(createInstituteDto: CreateInstituteDto): Promise<void> {
    try {
      const application = await this.database.application.findUnique({
        where: {
          id: createInstituteDto.applicationId,
        },
      });

      if (application.applicationStatus !== ApplicationStatus.Admission)
        throw new BadRequestException(
          `Application in ${application.applicationStatus} status.`,
        );

      await this.database.institute.create({
        data: {
          name: createInstituteDto.name,
          comment: createInstituteDto.comment,
          application: {
            connect: {
              id: createInstituteDto.applicationId,
            },
          },
        },
      });
    } catch (error) {
      console.error(error);
      if (error.code === 'P2002')
        throw new BadRequestException(`${error.meta.target} already exists`);
      else if (error.code === 'P2025')
        throw new BadRequestException(`${error.meta.cause}`);
      throw error;
    }
  }

  async editApplication(
    editApplicationDto: EditApplicationDto,
    user: EmployeeUserDto,
  ): Promise<void> {
    try {
      const application = await this.database.application.findUnique({
        where: { id: editApplicationDto.id },
      });

      if (!application)
        throw new NotFoundException(
          `Application with ID ${editApplicationDto.id} not found. `,
        );

      const changes: string[] = [];

      if (
        editApplicationDto.educationalLevel &&
        editApplicationDto.educationalLevel !== application.educationalLevel
      ) {
        changes.push(
          `Educational level was updated from ${application.educationalLevel} to ${editApplicationDto.educationalLevel}`,
        );
      }
      if (
        editApplicationDto.fieldOfStudy &&
        editApplicationDto.fieldOfStudy !== application.fieldOfStudy
      ) {
        changes.push(
          `Field of study was updated from ${application.fieldOfStudy} to ${editApplicationDto.fieldOfStudy}`,
        );
      }

      if (
        editApplicationDto.intake &&
        editApplicationDto.intake !== application.intake
      ) {
        changes.push(
          `Intake was updated from ${application.intake} to ${editApplicationDto.intake}`,
        );
      }

      if (
        editApplicationDto.applicationStatus &&
        editApplicationDto.applicationStatus !== application.applicationStatus
      ) {
        changes.push(
          `Application status was updated from ${application.applicationStatus} to ${editApplicationDto.applicationStatus}`,
        );
      }
      if (
        editApplicationDto.admissionStatus &&
        editApplicationDto.admissionStatus !== application.admissionStatus
      ) {
        changes.push(
          `Admission status was updated from ${application.admissionStatus} to ${editApplicationDto.admissionStatus}`,
        );
      }

      await this.database.$transaction(async () => {
        await this.database.application.update({
          where: { id: editApplicationDto.id },
          data: {
            educationalLevel: editApplicationDto.educationalLevel,
            fieldOfStudy: editApplicationDto.fieldOfStudy,
            intake: editApplicationDto.intake,
            applicationStatus: editApplicationDto.applicationStatus,
            updatedAt: new Date(Date.now()),
          },
        });

        await this.auditService.createAudit({
          entity: 'Application',
          operation: Operation.Update,
          recordId: application.id,
          userId: user.id,
          previousValues: JSON.stringify(
            plainToInstance(ApplicationDto, application, {
              excludeExtraneousValues: true,
            }),
          ),
          detail: changes.join(`\n`),
        });
      });
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async editEnglishTestRequirement(
    editApplicationDto: EditApplicationDto,
    user: EmployeeUserDto,
  ): Promise<void> {
    try {
      const application = await this.database.application.findUnique({
        where: { id: editApplicationDto.id },
        include: {
          student: {
            include: {
              agent: true,
              user: true,
            },
          },
          admission: true,
        },
      });

      if (!application)
        throw new NotFoundException(
          `Application with ID ${editApplicationDto.id} not found. `,
        );

      if (
        application.applicationStatus === ApplicationStatus.Deposit ||
        application.applicationStatus === ApplicationStatus.Visa ||
        application.applicationStatus === ApplicationStatus.VisaDecision
      )
        throw new BadRequestException(
          `Application in ${application.applicationStatus} status.`,
        );

      const changes: string[] = [];

      if (
        editApplicationDto.englishTestRequired &&
        editApplicationDto.englishTestRequired !==
          application.englishTestRequired
      ) {
        changes.push(
          `English test requirement was updated from ${application.englishTestRequired} to ${editApplicationDto.englishTestRequired}`,
        );
      }

      await this.database.$transaction(async () => {
        const updatedApplication = await this.database.application.update({
          where: { id: editApplicationDto.id },
          data: {
            englishTestRequired: editApplicationDto.englishTestRequired,
            applicationStatus:
              editApplicationDto.englishTestRequired ==
                EnglishTestRequiredStatus.Yes ||
              editApplicationDto.englishTestRequired ==
                EnglishTestRequiredStatus.Pending
                ? ApplicationStatus.EnglishTest
                : ApplicationStatus.Admission,
            updatedAt: new Date(Date.now()),
          },
        });

        await this.auditService.createAudit({
          entity: 'Application',
          operation: Operation.Update,
          recordId: application.id,
          userId: user.id,
          previousValues: JSON.stringify(
            plainToInstance(ApplicationDto, application, {
              excludeExtraneousValues: true,
            }),
          ),
          detail: changes.join(`\n`),
        });

        const createNotificationDto = new CreateNotificationDto();

        if (
          updatedApplication.englishTestRequired ==
          EnglishTestRequiredStatus.Yes
        ) {
          createNotificationDto.title = 'English Test';
          createNotificationDto.content = `English test is required for ${application.student.user.firstName} ${application.student.user.lastName} (${application.student.user.email}).`;
          createNotificationDto.recipientId = application.student.agent.userId;

          await this.notificationService.sendNotification(
            createNotificationDto,
          );

          createNotificationDto.title = 'English Test';
          createNotificationDto.content = `English test is required for ${application.student.user.firstName} ${application.student.user.lastName} (${application.student.user.email}).`;
          createNotificationDto.recipientId = application.admission.userId;

          await this.notificationService.sendNotification(
            createNotificationDto,
          );
        } else if (
          updatedApplication.englishTestRequired == EnglishTestRequiredStatus.No
        ) {
          createNotificationDto.title = 'English Test';
          createNotificationDto.content = `English test is not required for ${application.student.user.firstName} ${application.student.user.lastName} (${application.student.user.email}).`;
          createNotificationDto.recipientId = application.student.agent.userId;

          await this.notificationService.sendNotification(
            createNotificationDto,
          );

          createNotificationDto.title = 'English Test';
          createNotificationDto.content = `English test is not required for ${application.student.user.firstName} ${application.student.user.lastName} (${application.student.user.email}).`;
          createNotificationDto.recipientId = application.admission.userId;

          await this.notificationService.sendNotification(
            createNotificationDto,
          );
        }
      });
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async editApplicationAdmissionStatus(
    editApplicationDto: EditApplicationDto,
    user: EmployeeUserDto,
  ): Promise<void> {
    try {
      const application = await this.database.application.findUnique({
        where: { id: editApplicationDto.id },
        include: {
          student: {
            include: {
              user: true,
            },
          },
          institutes: true,
          visa: true,
        },
      });

      if (!application)
        throw new NotFoundException(
          `Application with ID ${editApplicationDto.id} not found.`,
        );

      if (!application.institutes || application.institutes.length == 0)
        throw new BadRequestException(`Application has no institute assigned.`);

      if (application.applicationStatus == ApplicationStatus.Admission) {
        await this.database.$transaction(async () => {
          const updatedApplication = await this.database.application.update({
            where: { id: editApplicationDto.id },
            data: {
              admissionStatus: editApplicationDto.admissionStatus,
              applicationStatus:
                editApplicationDto.admissionStatus == AdmissionStatus.Accepted
                  ? ApplicationStatus.Visa
                  : ApplicationStatus.Admission,
              updatedAt: new Date(Date.now()),
            },
          });

          if (editApplicationDto.admissionStatus == AdmissionStatus.Accepted) {
            const createNotificationDto = new CreateNotificationDto();
            createNotificationDto.title = `Application Update`;
            createNotificationDto.content = `Student ${application.student.firstName} ${application.student.lastName} is in visa status.`;
            createNotificationDto.recipientId = application.visa.userId;

            await this.notificationService.sendNotification(
              createNotificationDto,
            );
          }

          await this.auditService.createAudit({
            entity: 'Application',
            operation: Operation.Update,
            recordId: application.id,
            userId: user.id,
            previousValues: JSON.stringify(
              plainToInstance(ApplicationDto, application, {
                excludeExtraneousValues: true,
              }),
            ),
            detail: `admissionStatus was updated from ${application.admissionStatus} to ${editApplicationDto.admissionStatus}`,
          });

          if (updatedApplication.admissionStatus === AdmissionStatus.Accepted) {
            const createNotificationDto = new CreateNotificationDto();
            createNotificationDto.title = 'Admission Accepted!';
            createNotificationDto.content = `Your admission has been accepted. Contact your agent for next steps.`;
            createNotificationDto.recipientId = application.student.user.id;

            await this.notificationService.sendNotification(
              createNotificationDto,
            );
          }

          if (updatedApplication.admissionStatus === AdmissionStatus.Rejected) {
            const createNotificationDto = new CreateNotificationDto();
            createNotificationDto.title = 'Admission Rejected!';
            createNotificationDto.content = `Your admission has been rejected. Contact your agent for next steps.`;
            createNotificationDto.recipientId = application.student.user.id;

            await this.notificationService.sendNotification(
              createNotificationDto,
            );
          }
        });
      } else
        throw new NotFoundException(
          `Application is in ${application?.applicationStatus} status.`,
        );
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async editPendingDocument(
    editPendingDocumentDto: EditPendingDocument,
    user: EmployeeUserDto,
  ): Promise<void> {
    try {
      const pendingDocument = await this.database.pendingDocument.findUnique({
        where: { id: editPendingDocumentDto.id },
        include: { application: true },
      });

      if (!pendingDocument)
        throw new NotFoundException(
          `Pending document with ID ${editPendingDocumentDto.id} not found. `,
        );

      const changes: string[] = [];

      if (
        editPendingDocumentDto.name &&
        editPendingDocumentDto.name !== pendingDocument.name
      ) {
        changes.push(
          `name was updated from ${pendingDocument.name} to ${editPendingDocumentDto.name}`,
        );
      }

      if (
        editPendingDocumentDto.fileUrl &&
        editPendingDocumentDto.fileUrl !== pendingDocument.fileUrl
      ) {
        changes.push(`file was updated`);
      }

      await this.database.$transaction(async () => {
        await this.database.pendingDocument.update({
          where: { id: editPendingDocumentDto.id },
          data: {
            name: editPendingDocumentDto.name,
            fileUrl: editPendingDocumentDto.fileUrl,
            updatedAt: new Date(Date.now()),
          },
        });

        await this.auditService.createAudit({
          entity: 'Pending Document',
          operation: Operation.Update,
          recordId: pendingDocument.application.id,
          userId: user.id,
          previousValues: JSON.stringify(
            plainToInstance(PendingDocumentDto, pendingDocument, {
              excludeExtraneousValues: true,
            }),
          ),
          detail: changes.join(`\n`),
        });
      });
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async editInstitute(editInstituteDto: EditInstituteDto): Promise<void> {
    try {
      const institute = await this.database.institute.findUnique({
        where: { id: editInstituteDto.id },
        include: {
          application: true,
        },
      });

      if (!institute)
        throw new NotFoundException(
          `Institute with ID ${editInstituteDto.id} not found.`,
        );

      if (
        institute.application.applicationStatus !== ApplicationStatus.Admission
      )
        throw new BadRequestException(
          `Application in ${institute.application.applicationStatus} status.`,
        );

      await this.database.institute.update({
        where: { id: editInstituteDto.id },
        data: {
          name: editInstituteDto.name,
          comment: editInstituteDto.comment,
          admissionStatus: editInstituteDto.admissionStatus,
          updatedAt: new Date(Date.now()),
        },
      });
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async deleteApplication(
    applicationId: string,
    user: EmployeeUserDto,
  ): Promise<void> {
    try {
      const application = await this.database.application.findUnique({
        where: { id: applicationId },
        include: {
          visa: true,
          finance: true,
          admission: true,
        },
      });

      if (!application)
        throw new NotFoundException(
          `Application with ID ${applicationId} not found.`,
        );

      await this.database.$transaction(async () => {
        await this.database.employee.update({
          where: { id: application.visa.id },
          data: {
            applicationAssignmentCount:
              application.visa.applicationAssignmentCount - 1,
          },
        });

        await this.database.employee.update({
          where: { id: application.finance.id },
          data: {
            applicationAssignmentCount:
              application.finance.applicationAssignmentCount - 1,
          },
        });

        await this.database.employee.update({
          where: { id: application.admission.id },
          data: {
            applicationAssignmentCount:
              application.admission.applicationAssignmentCount - 1,
          },
        });

        await this.database.pendingDocument.deleteMany({
          where: { applicationId: applicationId },
        });

        await this.database.application.delete({
          where: { id: applicationId },
        });

        await this.auditService.createAudit({
          entity: 'Application',
          operation: Operation.Delete,
          recordId: application.id,
          userId: user.id,
          previousValues: JSON.stringify(
            plainToInstance(ApplicationDto, application, {
              excludeExtraneousValues: true,
            }),
          ),
        });
      });
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async deletePendingDocument(
    pendingDocumentId: string,
    user: EmployeeUserDto,
  ): Promise<void> {
    try {
      const pendingDocument = await this.database.pendingDocument.findUnique({
        where: { id: pendingDocumentId },
        include: { application: true },
      });

      if (!pendingDocument)
        throw new NotFoundException(
          `Pending document with ID ${pendingDocumentId} not found.`,
        );

      await this.database.$transaction(async () => {
        await this.database.pendingDocument.delete({
          where: { id: pendingDocumentId },
        });

        await this.auditService.createAudit({
          entity: 'Pending Document',
          operation: Operation.Delete,
          recordId: pendingDocument.application.id,
          userId: user.id,
          previousValues: JSON.stringify(
            plainToInstance(PendingDocumentDto, pendingDocument, {
              excludeExtraneousValues: true,
            }),
          ),
        });
      });
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async deleteInstitute(id: string): Promise<void> {
    try {
      const institute = await this.database.institute.findUnique({
        where: { id: id },
        include: {
          application: true,
        },
      });

      if (!institute)
        throw new NotFoundException(`Institute with ID ${id} not found.`);

      if (
        institute.application.applicationStatus !== ApplicationStatus.Admission
      )
        throw new BadRequestException(
          `Application in ${institute.application.applicationStatus} status.`,
        );

      await this.database.institute.delete({
        where: { id: id },
      });
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
}
