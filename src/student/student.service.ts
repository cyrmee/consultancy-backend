import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { plainToInstance } from 'class-transformer';
import {
  CreateStudentDto,
  EditStudentAddressDto,
  StudentDto,
  StudentAddressDto,
  EditPassportDto,
  PassportDto,
  StudentFilterDto,
  StudentWithoutApplicationDto,
  EditStudentDto,
  CreateNonClientStudentDto,
  NonClientStudentDto,
} from './dto';
import * as argon from 'argon2';
import {
  AdmissionStatus,
  ApplicationStatus,
  CanadaVisaApplicationStatus,
  ConversationType,
  Country,
  EventCategory,
  Gender,
  Operation,
  PaymentStatus,
  Role,
  Season,
  UnitedStatesVisaApplicationStatus,
  VisaPaymentStatus,
} from '@prisma/client';
import { FileService } from '../common/files.service';
import { AuditService } from '../audit/audit.service';
import { EmployeeUserDto } from '../auth/dto';
import { IsString, IsEnum, validate } from 'class-validator';
import { CalendarColor } from '../common/enums';
import { CreateApplicationDto } from '../application/dto';
import { CryptoService } from '../common/crypto.service';
import { MailService } from '../mail/mail.service';
import { NotificationService } from '../notification/notification.service';
import { CreateNotificationDto } from '../notification/dto';
import { CalendarService } from '../calendar/calendar.service';
import { CreateCalendarDto } from '../calendar/dto';
import { UserDto } from '../user/dto';

@Injectable()
export class StudentService {
  constructor(
    private readonly database: PrismaService,
    private readonly fileService: FileService,
    private readonly notificationService: NotificationService,
    private readonly auditService: AuditService,
    private readonly cryptoService: CryptoService,
    private readonly mailService: MailService,
    private readonly calendarService: CalendarService,
  ) {}

  async studentExists(studentId: string): Promise<boolean> {
    return (await this.database.student.findUnique({
      where: { id: studentId },
    }))
      ? true
      : false;
  }

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

  async queryStudents(
    filter: StudentFilterDto,
    query: string,
    page: number = 1,
    pageSize: number = 15,
  ): Promise<{ students: StudentDto[]; totalCount: number; pages: number }> {
    try {
      if (filter.gender) {
        await this.validateType('gender', filter.gender, Gender);
      }
      if (filter.country) {
        await this.validateType('country', filter.country, Country);
      }
      if (filter.intake) {
        await this.validateType('intake', filter.intake, Season);
      }

      const skipCount = (page - 1) * pageSize;
      const students = await this.database.student.findMany({
        where: {
          isClient: true,
          AND: [
            filter.gender ? { gender: filter.gender as Gender } : {},
            filter.country
              ? {
                  applications: {
                    some: { country: filter.country as Country },
                  },
                }
              : {},
            filter.intake
              ? {
                  applications: {
                    some: { intake: filter.intake as Season },
                  },
                }
              : {},
            { isActive: filter.isActive },
            query
              ? {
                  OR: [
                    { firstName: { contains: query, mode: 'insensitive' } },
                    { lastName: { contains: query, mode: 'insensitive' } },
                    {
                      admissionEmail: {
                        contains: query,
                        mode: 'insensitive',
                      },
                    },
                    { branch: { contains: query, mode: 'insensitive' } },
                    {
                      passportNumber: { equals: query, mode: 'insensitive' },
                    },
                    {
                      user: {
                        OR: [
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
                }
              : {},
          ],
        },
        include: {
          user: true,
        },
        skip: skipCount,
        take: pageSize,
        orderBy: { updatedAt: 'desc' },
      });

      const totalCount = await this.database.student.count({
        where: {
          isClient: true,
          AND: [
            filter.gender ? { gender: filter.gender as Gender } : {},
            filter.country
              ? {
                  applications: {
                    some: { country: filter.country as Country },
                  },
                }
              : {},
            filter.intake
              ? {
                  applications: {
                    some: { intake: filter.intake as Season },
                  },
                }
              : {},
            { isActive: filter.isActive },
            query
              ? {
                  OR: [
                    { firstName: { contains: query, mode: 'insensitive' } },
                    { lastName: { contains: query, mode: 'insensitive' } },
                    {
                      admissionEmail: {
                        contains: query,
                        mode: 'insensitive',
                      },
                    },
                    { branch: { contains: query, mode: 'insensitive' } },
                    {
                      passportNumber: { equals: query, mode: 'insensitive' },
                    },
                    {
                      user: {
                        OR: [
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
                }
              : {},
          ],
        },
      });

      return {
        students: plainToInstance(StudentDto, students, {
          excludeExtraneousValues: true,
        }),
        totalCount: totalCount,
        pages: Math.ceil(totalCount / pageSize),
      };
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async queryStudentsByAgent(
    filter: StudentFilterDto,
    query: string,
    user: EmployeeUserDto,
    page: number = 1,
    pageSize: number = 15,
  ): Promise<{ students: StudentDto[]; totalCount: number; pages: number }> {
    try {
      if (filter.gender) {
        await this.validateType('gender', filter.gender, Gender);
      }
      if (filter.country) {
        await this.validateType('country', filter.country, Country);
      }
      if (filter.intake) {
        await this.validateType('intake', filter.intake, Season);
      }

      const skipCount = (page - 1) * pageSize;
      const students = await this.database.student.findMany({
        where: {
          isClient: true,
          AND: [
            filter.gender ? { gender: filter.gender as Gender } : {},
            filter.country
              ? {
                  applications: {
                    some: { country: filter.country as Country },
                  },
                }
              : {},
            filter.intake
              ? {
                  applications: {
                    some: { intake: filter.intake as Season },
                  },
                }
              : {},
            { isActive: filter.isActive },
            {
              OR: [{ agentId: user.employee.id }, { agentId: null }],
            },
            query
              ? {
                  OR: [
                    { firstName: { contains: query, mode: 'insensitive' } },
                    { lastName: { contains: query, mode: 'insensitive' } },
                    {
                      admissionEmail: {
                        contains: query,
                        mode: 'insensitive',
                      },
                    },
                    { branch: { contains: query, mode: 'insensitive' } },
                    {
                      passportNumber: { equals: query, mode: 'insensitive' },
                    },
                    {
                      user: {
                        OR: [
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
                }
              : {},
          ],
        },
        include: {
          user: true,
        },
        skip: skipCount,
        take: pageSize,
        orderBy: { updatedAt: 'desc' },
      });

      const totalCount = await this.database.student.count({
        where: {
          isClient: true,
          AND: [
            filter.gender ? { gender: filter.gender as Gender } : {},
            filter.country
              ? {
                  applications: {
                    some: { country: filter.country as Country },
                  },
                }
              : {},
            filter.intake
              ? {
                  applications: {
                    some: { intake: filter.intake as Season },
                  },
                }
              : {},
            { isActive: filter.isActive },
            {
              OR: [{ agentId: user.employee.id }, { agentId: null }],
            },
            query
              ? {
                  OR: [
                    { firstName: { contains: query, mode: 'insensitive' } },
                    { lastName: { contains: query, mode: 'insensitive' } },
                    {
                      admissionEmail: {
                        contains: query,
                        mode: 'insensitive',
                      },
                    },
                    { branch: { contains: query, mode: 'insensitive' } },
                    {
                      passportNumber: { equals: query, mode: 'insensitive' },
                    },
                    {
                      user: {
                        OR: [
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
                }
              : {},
            { agentId: user.employee.id },
          ],
        },
      });

      return {
        students: plainToInstance(StudentDto, students, {
          excludeExtraneousValues: true,
        }),
        totalCount: totalCount,
        pages: Math.ceil(totalCount / pageSize),
      };
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async getStudentById(
    studentId: string,
    user: EmployeeUserDto,
  ): Promise<StudentDto | StudentWithoutApplicationDto> {
    try {
      const student = await this.database.student.findUnique({
        where: { id: studentId },
        include: {
          applications: {
            orderBy: { updatedAt: 'desc' },
          },
          educationBackgrounds: true,
          studentAddress: true,
          studentRelations: true,
          agent: true,
          user: true,
          additionalStudentFiles: true,
        },
      });

      if (!student)
        throw new NotFoundException(`Student with ID ${studentId} not found.`);

      const hasAdminOrAgentRole = (roles: Role[]): boolean =>
        roles.includes(Role.Agent) || roles.includes(Role.Admin);

      return hasAdminOrAgentRole(user.roles)
        ? plainToInstance(StudentDto, student, {
            excludeExtraneousValues: true,
          })
        : plainToInstance(StudentWithoutApplicationDto, student, {
            excludeExtraneousValues: true,
          });
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async getAddress(studentId: string): Promise<StudentAddressDto> {
    try {
      const student = await this.database.student.findUnique({
        where: { id: studentId },
        include: {
          studentAddress: true,
        },
      });

      if (!student)
        throw new NotFoundException(`Student with ID ${studentId} not found.`);

      return plainToInstance(StudentAddressDto, student.studentAddress, {
        excludeExtraneousValues: true,
      });
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async createStudent(
    createStudentDto: CreateStudentDto,
    user: EmployeeUserDto,
  ): Promise<void> {
    try {
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

      if (!finance) throw new BadRequestException('No finance officer found.');

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

      const agent = await this.database.employee.findFirst({
        where: {
          user: {
            roles: { has: Role.Agent },
          },
          studentAssignmentCount: { gte: 0 },
          isSuspended: false,
        },
        orderBy: { studentAssignmentCount: 'asc' },
      });

      const password = await this.cryptoService.generateRandomPassword();

      const expirationDate = Date.now() + 9 * 24 * 60 * 60 * 1000;

      await this.database.$transaction(async () => {
        const student = await this.database.student.create({
          data: {
            firstName: createStudentDto.firstName,
            lastName: createStudentDto.lastName,
            gender: createStudentDto.gender,
            dateOfBirth: createStudentDto.dateOfBirth,
            admissionEmail: createStudentDto.email,
            branch: createStudentDto.branch,
            isActive: true,
            user: {
              create: {
                email: createStudentDto.email,
                firstName: createStudentDto.firstName,
                lastName: createStudentDto.lastName,
                phoneNumber: createStudentDto.phoneNumber,
                gender: createStudentDto.gender,
                hash: await argon.hash(password),
                roles: [Role.Student],
                isEmailVerified: true,
                isPhoneNumberVerified: true,
              },
            },
            agent: {
              connect: {
                id: user.roles.includes(Role.Admin)
                  ? agent.id
                  : user.employee.id,
              },
            },
            studentAddress: {
              create: {
                region: createStudentDto.region,
                city: createStudentDto.city,
                subCity: createStudentDto.subCity,
                woreda: createStudentDto.woreda,
                kebele: createStudentDto.kebele,
                houseNumber: createStudentDto.houseNumber,
              },
            },
          },
          include: {
            user: true,
            agent: true,
          },
        });

        const application = await this.database.application.create({
          data: {
            country: createStudentDto.country,
            educationalLevel: createStudentDto.educationalLevel,
            fieldOfStudy: createStudentDto.fieldOfStudy,
            intake: createStudentDto.intake,
            applicationStatus: ApplicationStatus.Deposit,
            admissionStatus: AdmissionStatus.Pending,
            student: {
              connect: { id: student.id },
            },
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

        let agentId: string = user.employee.id;
        if (user.roles.includes(Role.Admin)) agentId = agent.id;

        await this.database.employee.update({
          where: { id: agentId },
          data: {
            studentAssignmentCount: user.employee.studentAssignmentCount + 1,
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

        await this.database.conversation.create({
          data: {
            participants: {
              connect: [{ id: student.userId }, { id: student.agent.userId }],
            },
          },
        });

        const forums = await this.database.conversation.findMany({
          where: {
            participants: {
              none: { id: student.userId },
            },
            type: ConversationType.Forum,
          },
          select: {
            id: true,
          },
        });

        if (forums)
          forums.forEach(async (forum) => {
            await this.database.conversation.update({
              where: { id: forum.id },
              data: {
                participants: {
                  connect: [{ id: student.userId }],
                },
                updatedAt: new Date(Date.now()),
              },
            });
          });

        await this.auditService.createAudit({
          entity: 'Application',
          operation: Operation.Create,
          recordId: application.id,
          userId: user.id,
          previousValues: null,
        });

        const createNotificationDto = new CreateNotificationDto();
        createNotificationDto.title = `Application Update`;
        createNotificationDto.content = `Student ${student.firstName} ${student.lastName} is in deposit status.`;
        createNotificationDto.recipientId = finance.userId;

        await this.notificationService.sendNotification(createNotificationDto);

        // TODO: Create a password and send it to the student via email and phone number
        await this.mailService.sendPasswordViaEmail(
          createStudentDto.email,
          password,
        );

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

  async activateStudent(
    user: EmployeeUserDto,
    createApplicationDto: CreateApplicationDto,
  ): Promise<void> {
    try {
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

      if (!finance) throw new BadRequestException('No finance officer found.');

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

      let agentId: string;

      if (user.roles.includes(Role.Admin)) {
        const agent = await this.database.employee.findFirst({
          where: {
            user: {
              roles: { has: Role.Agent },
            },
            studentAssignmentCount: { gte: 0 },
            isSuspended: false,
          },
          orderBy: { studentAssignmentCount: 'asc' },
        });

        agentId = agent.id;
      } else agentId = user.employee.id;

      const expirationDate = Date.now() + 9 * 24 * 60 * 60 * 1000;

      await this.database.$transaction(async () => {
        const student = await this.database.student.update({
          where: { id: createApplicationDto.studentId },
          data: {
            isActive: true,
            agent: {
              connect: {
                id: agentId,
              },
            },
            updatedAt: new Date(Date.now()),
          },
          include: {
            user: true,
            agent: true,
          },
        });

        const application = await this.database.application.create({
          data: {
            country: createApplicationDto.country,
            educationalLevel: createApplicationDto.educationalLevel,
            fieldOfStudy: createApplicationDto.fieldOfStudy,
            intake: createApplicationDto.intake,
            applicationStatus: ApplicationStatus.Deposit,
            admissionStatus: AdmissionStatus.Pending,
            student: {
              connect: { id: student.id },
            },
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

        const agent = await this.database.employee.findFirst({
          where: {
            id: agentId,
          },
        });

        await this.database.employee.update({
          where: { id: agentId },
          data: {
            studentAssignmentCount: agent.studentAssignmentCount + 1,
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

        await this.database.conversation.create({
          data: {
            participants: {
              connect: [{ id: student.userId }, { id: student.agent.userId }],
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

        const employeeCreateNotificationDto = new CreateNotificationDto();
        employeeCreateNotificationDto.title = `Application Update`;
        employeeCreateNotificationDto.content = `Student ${student.firstName} ${student.lastName} is in deposit status.`;
        employeeCreateNotificationDto.recipientId = finance.userId;

        await this.notificationService.sendNotification(
          employeeCreateNotificationDto,
        );

        const studentCreateNotificationDto = new CreateNotificationDto();
        studentCreateNotificationDto.title = 'Account Activated';
        studentCreateNotificationDto.content =
          'Your account has been activated! You can now chat with your assigned agent.';
        studentCreateNotificationDto.recipientId = student.user.id;

        await this.notificationService.sendNotification(
          studentCreateNotificationDto,
        );

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

  async editStudent(editStudentDto: EditStudentDto): Promise<void> {
    try {
      const student = await this.database.student.findUnique({
        where: { id: editStudentDto.id },
      });

      if (!student)
        throw new NotFoundException(
          `Student with ID ${editStudentDto.id} not found.`,
        );

      await this.database.student.update({
        where: { id: editStudentDto.id },
        data: {
          firstName: editStudentDto.firstName,
          lastName: editStudentDto.lastName,
          gender: editStudentDto.gender,
          dateOfBirth: editStudentDto.dateOfBirth,
          admissionEmail: editStudentDto.admissionEmail,
          branch: editStudentDto.branch,
          image: editStudentDto.image,
          passportNumber: editStudentDto.passportNumber,
          issueDate: editStudentDto.issueDate,
          expiryDate: editStudentDto.expiryDate,
          passportAttachment: editStudentDto.passportAttachment,
          updatedAt: new Date(Date.now()),
          user: {
            update: {
              data: {
                firstName: editStudentDto.firstName,
                lastName: editStudentDto.lastName,
                phoneNumber: editStudentDto.phoneNumber,
                gender: editStudentDto.gender,
              },
            },
          },
        },
      });
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async queryNonClientStudents(
    query: string,
    page: number = 1,
    pageSize: number = 15,
  ): Promise<{
    students: NonClientStudentDto[];
    totalCount: number;
    pages: number;
  }> {
    try {
      const skipCount = (page - 1) * pageSize;
      const students = await this.database.student.findMany({
        where: {
          isClient: false,
          AND: [
            query
              ? {
                  OR: [
                    { firstName: { contains: query, mode: 'insensitive' } },
                    { lastName: { contains: query, mode: 'insensitive' } },
                    {
                      admissionEmail: {
                        contains: query,
                        mode: 'insensitive',
                      },
                    },
                    { branch: { contains: query, mode: 'insensitive' } },
                    {
                      passportNumber: { equals: query, mode: 'insensitive' },
                    },
                    {
                      user: {
                        OR: [
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
                }
              : {},
          ],
        },
        include: {
          user: true,
          futureStudentInfo: true,
        },
        skip: skipCount,
        take: pageSize,
        orderBy: { updatedAt: 'desc' },
      });

      const totalCount = await this.database.student.count({
        where: {
          isClient: false,
          AND: [
            query
              ? {
                  OR: [
                    { firstName: { contains: query, mode: 'insensitive' } },
                    { lastName: { contains: query, mode: 'insensitive' } },
                    {
                      admissionEmail: {
                        contains: query,
                        mode: 'insensitive',
                      },
                    },
                    { branch: { contains: query, mode: 'insensitive' } },
                    {
                      passportNumber: { equals: query, mode: 'insensitive' },
                    },
                    {
                      user: {
                        OR: [
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
                }
              : {},
          ],
        },
      });

      return {
        students: plainToInstance(NonClientStudentDto, students, {
          excludeExtraneousValues: true,
        }),
        totalCount: totalCount,
        pages: Math.ceil(totalCount / pageSize),
      };
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async createNonClientStudent(
    createNonClientStudentDto: CreateNonClientStudentDto,
    user: EmployeeUserDto,
  ): Promise<void> {
    try {
      await this.database.$transaction(async () => {
        let agentId: string;

        if (user.roles.includes(Role.Admin)) {
          const agent = await this.database.employee.findFirst({
            where: {
              user: {
                roles: { has: Role.Agent },
              },
              studentAssignmentCount: { gte: 0 },
              isSuspended: false,
            },
            orderBy: { studentAssignmentCount: 'asc' },
          });

          agentId = agent.id;
        } else agentId = user.employee.id;

        const agent = await this.database.employee.findFirst({
          where: {
            id: agentId,
          },
        });

        const student = await this.database.student.create({
          data: {
            firstName: createNonClientStudentDto.firstName,
            lastName: createNonClientStudentDto.lastName,
            gender: createNonClientStudentDto.gender,
            dateOfBirth: createNonClientStudentDto.dateOfBirth,
            admissionEmail: createNonClientStudentDto.email,
            isActive: false,
            isClient: false,
            user: {
              create: {
                email: createNonClientStudentDto.email,
                firstName: createNonClientStudentDto.firstName,
                lastName: createNonClientStudentDto.lastName,
                phoneNumber: createNonClientStudentDto.phoneNumber,
                gender: createNonClientStudentDto.gender,
                hash: await argon.hash(createNonClientStudentDto.password),
                roles: [Role.Student],
              },
            },
            agent: {
              connect: {
                id: agentId,
              },
            },
            studentAddress: {
              create: {
                region: createNonClientStudentDto.region,
                city: createNonClientStudentDto.city,
                subCity: createNonClientStudentDto.subCity,
                woreda: createNonClientStudentDto.woreda,
                kebele: createNonClientStudentDto.kebele,
                houseNumber: createNonClientStudentDto.houseNumber,
              },
            },
            futureStudentInfo: {
              create: {
                level: createNonClientStudentDto.level,
                field: createNonClientStudentDto.field,
                country: createNonClientStudentDto.country,
              },
            },
          },
          include: {
            user: true,
          },
        });

        if (student.agentId)
          await this.database.employee.update({
            where: { id: agentId },
            data: {
              studentAssignmentCount: agent.studentAssignmentCount + 1,
            },
          });

        const forums = await this.database.conversation.findMany({
          where: {
            participants: {
              none: { id: student.userId },
            },
            type: ConversationType.Forum,
          },
          select: {
            id: true,
          },
        });

        if (forums)
          forums.forEach(async (forum) => {
            await this.database.conversation.update({
              where: { id: forum.id },
              data: {
                participants: {
                  connect: [{ id: student.userId }],
                },
                updatedAt: new Date(Date.now()),
              },
            });
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

  async editNonClientStudent(studentId: string): Promise<void> {
    try {
      const student = this.database.student.findUnique({
        where: { id: studentId },
      });

      if (!student)
        throw new NotFoundException(`Student with ID ${studentId} not found.`);

      await this.database.student.update({
        where: {
          id: studentId,
          isClient: false,
        },
        data: {
          isClient: true,
          updatedAt: new Date(Date.now()),
        },
      });
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async editAddress(editAddressDto: EditStudentAddressDto): Promise<void> {
    try {
      const student = await this.database.student.findUnique({
        where: { id: editAddressDto.studentId },
      });

      if (!student)
        throw new NotFoundException(
          `Student with ID ${editAddressDto.studentId} not found.`,
        );

      await this.database.student.update({
        where: { id: editAddressDto.studentId },
        data: {
          studentAddress: {
            update: {
              region: editAddressDto.region,
              city: editAddressDto.city,
              subCity: editAddressDto.subCity,
              woreda: editAddressDto.woreda,
              kebele: editAddressDto.kebele,
              houseNumber: editAddressDto.houseNumber,
              updatedAt: new Date(Date.now()),
            },
          },
        },
      });
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async deleteStudent(studentId: string): Promise<void> {
    try {
      const student = await this.database.student.findUnique({
        where: { id: studentId },
      });

      if (!student)
        throw new NotFoundException(`Student with ID ${studentId} not found.`);

      await this.deleteImage(studentId);
      await this.deletePassportImage(studentId);

      await this.database.$transaction(async () => {
        await this.database.student.delete({
          where: { id: studentId },
        });

        await this.database.user.delete({
          where: { id: student.userId },
        });
      });
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async deleteNonClientStudent(studentId: string): Promise<void> {
    try {
      const student = await this.database.student.findUnique({
        where: { id: studentId, isClient: false },
      });

      if (!student)
        throw new NotFoundException(`Student with ID ${studentId} not found.`);

      await this.database.$transaction(async () => {
        await this.database.student.delete({
          where: { id: studentId },
        });

        await this.database.user.delete({
          where: { id: student.userId },
        });
      });
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  // * Image related services
  async editImage(studentId: string, imageName: string): Promise<void> {
    try {
      const student = await this.database.student.findUnique({
        where: { id: studentId },
      });

      if (!student)
        throw new BadRequestException(`Student with ID ${studentId} not found`);

      await this.database.student.update({
        where: { id: studentId },
        data: { image: imageName, updatedAt: new Date(Date.now()) },
      });
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async getImageById(studentId: string): Promise<string> {
    try {
      const student = await this.database.student.findUnique({
        where: { id: studentId },
      });

      if (!student)
        throw new NotFoundException(`Student with ID ${studentId} not found.`);

      if (!student.image)
        throw new NotFoundException(
          `Student image for student ID ${studentId} not found.`,
        );

      if (!(await this.fileService.fileExistsAsync(student.image)))
        throw new NotFoundException(`File doesn't exist for ${studentId}`);

      return student.image;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async deleteImage(studentId: string): Promise<void> {
    try {
      const student = await this.database.student.findUnique({
        where: {
          id: studentId,
        },
      });

      if (student?.image) {
        await this.fileService.deleteFileAsync(student.image);

        await this.database.student.update({
          where: { id: studentId },
          data: {
            image: '',
            updatedAt: new Date(Date.now()),
          },
        });
      }
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async editPassport(editPassportDto: EditPassportDto): Promise<void> {
    try {
      const student = await this.database.student.findUnique({
        where: { id: editPassportDto.studentId },
      });

      if (!student)
        throw new NotFoundException(
          `Student with ID ${editPassportDto.studentId} not found.`,
        );

      if (editPassportDto.passportAttachment)
        await this.fileService.deleteFileAsync(student.passportAttachment);

      await this.database.student.update({
        where: { id: editPassportDto.studentId },
        data: {
          passportNumber: editPassportDto.passportNumber,
          expiryDate: editPassportDto.expiryDate,
          issueDate: editPassportDto.issueDate,
          passportAttachment: editPassportDto.passportAttachment,
          updatedAt: new Date(Date.now()),
        },
      });
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async getPassportInfoById(studentId: string): Promise<PassportDto> {
    try {
      const student = await this.database.student.findUnique({
        where: { id: studentId },
      });

      if (!student)
        throw new NotFoundException(`Student with ID ${studentId} not found.`);

      return plainToInstance(PassportDto, student, {
        excludeExtraneousValues: true,
      });
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async deletePassportImage(studentId: string): Promise<void> {
    try {
      const student = await this.database.student.findUnique({
        where: {
          id: studentId,
        },
      });

      if (student?.passportAttachment) {
        await this.fileService.deleteFileAsync(student.passportAttachment);

        await this.database.student.update({
          where: { id: studentId },
          data: {
            passportAttachment: '',
            updatedAt: new Date(Date.now()),
          },
        });
      }
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
}
