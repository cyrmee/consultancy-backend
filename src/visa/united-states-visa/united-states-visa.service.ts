import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CreateInterviewTrainingScheduleDto,
  EditInterviewTrainingScheduleDto,
  EditUnitedStatesVisaDto,
  InterviewTrainingScheduleDto,
  UnitedStatesVisaDto,
} from './dto';
import { plainToInstance } from 'class-transformer';
import { PrismaService } from '../../prisma/prisma.service';
import {
  AdmissionStatus,
  ApplicationStatus,
  DepositPaymentStatus,
  EventCategory,
  InterviewScheduleStatus,
  Operation,
  Role,
  UnitedStatesVisaApplicationStatus,
  VisaPaymentStatus,
} from '@prisma/client';
import { FileService } from '../../common/files.service';
import { NotificationService } from '../../notification/notification.service';
import { CreateNotificationDto } from '../../notification/dto';
import { AuditService } from '../../audit/audit.service';
import { EmployeeUserDto } from '../../auth/dto';
import { CalendarColor } from '../../common/enums';
import { DateService } from '../../common/date.service';
import { CalendarService } from '../../calendar/calendar.service';
import { CreateCalendarDto, EditCalendarDto } from '../../calendar/dto';
import { UserDto } from '../../user/dto';

@Injectable()
export class UnitedStatesVisaService {
  constructor(
    private readonly database: PrismaService,
    private readonly fileService: FileService,
    private readonly notificationService: NotificationService,
    private readonly auditService: AuditService,
    private readonly dateService: DateService,
    private readonly calendarService: CalendarService,
  ) {}

  async visaExists(id: string): Promise<boolean> {
    return (
      (await this.database.unitedStatesVisa.findUnique({
        where: { id: id },
      })) != null
    );
  }

  async checkApplicationStatus(applicationId: string): Promise<void> {
    const application = await this.database.application.findUnique({
      where: { id: applicationId },
    });

    if (application.admissionStatus === AdmissionStatus.Rejected)
      throw new BadRequestException(
        `Admission is in ${application?.admissionStatus} status.`,
      );

    if (application.applicationStatus !== ApplicationStatus.Visa) {
      throw new BadRequestException(
        `Application is in ${application?.applicationStatus} status.`,
      );
    }
  }

  async getVisaApplicationStatusById(
    id: string,
  ): Promise<UnitedStatesVisaApplicationStatus> {
    try {
      const visa = await this.database.unitedStatesVisa.findUnique({
        where: { id: id },
        include: { application: true },
      });

      if (
        visa.application.applicationStatus !== ApplicationStatus.Visa &&
        visa.application.applicationStatus !== ApplicationStatus.VisaDecision
      ) {
        throw new BadRequestException(
          `Application is in ${visa.application?.applicationStatus} status.`,
        );
      }

      return visa.visaApplicationStatus;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async getVisaByApplicationId(
    applicationId: string,
  ): Promise<UnitedStatesVisaDto> {
    try {
      const visa = await this.database.unitedStatesVisa.findUnique({
        where: { applicationId },
        include: {
          interviewTrainingSchedules: true,
          application: true,
        },
      });

      if (
        visa.application.applicationStatus !== ApplicationStatus.Visa &&
        visa.application.applicationStatus !== ApplicationStatus.VisaDecision
      ) {
        throw new BadRequestException(
          `Application is in ${visa.application?.applicationStatus} status.`,
        );
      }

      return plainToInstance(UnitedStatesVisaDto, visa, {
        excludeExtraneousValues: true,
      });
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async getVisaByApplicationIdForLoggedInStudent(
    userId: string,
    applicationId: string,
  ): Promise<UnitedStatesVisaDto> {
    try {
      const user = await this.database.user.findUnique({
        where: { id: userId, roles: { has: Role.Student } },
        include: {
          student: {
            where: { isActive: true },
            include: {
              applications: {
                where: { id: applicationId },
              },
            },
          },
        },
      });

      if (!user || !user.student)
        throw new NotFoundException(`User with ID ${userId} not found.`);

      if (!user.student.applications)
        throw new ForbiddenException(
          `Can't access application that are not yours.`,
        );

      const visa = await this.database.unitedStatesVisa.findUnique({
        where: { applicationId },
        include: {
          interviewTrainingSchedules: true,
          application: true,
        },
      });

      if (
        visa.application.applicationStatus !== ApplicationStatus.Visa &&
        visa.application.applicationStatus !== ApplicationStatus.VisaDecision
      ) {
        throw new BadRequestException(
          `Application is in ${visa.application?.applicationStatus} status.`,
        );
      }

      return plainToInstance(UnitedStatesVisaDto, visa, {
        excludeExtraneousValues: true,
      });
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async getInterviewTrainingSchedule(
    unitedStatesVisaId: string,
  ): Promise<InterviewTrainingScheduleDto[]> {
    try {
      const interviewTrainingSchedules =
        await this.database.interviewTrainingSchedule.findMany({
          where: { unitedStatesVisaId: unitedStatesVisaId },
          orderBy: { createdAt: 'asc' },
          include: { unitedStatesVisa: { include: { application: true } } },
        });

      if (interviewTrainingSchedules.length > 0) {
        await this.checkApplicationStatus(
          interviewTrainingSchedules[0].unitedStatesVisa.application.id,
        );
      }

      return plainToInstance(
        InterviewTrainingScheduleDto,
        interviewTrainingSchedules,
        {
          excludeExtraneousValues: true,
        },
      );
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async editRequiredVisaDocuments(
    editUnitedStatesVisaDto: EditUnitedStatesVisaDto,
    user: EmployeeUserDto,
  ): Promise<void> {
    const visa = await this.database.unitedStatesVisa.findUnique({
      where: { id: editUnitedStatesVisaDto.id },
      include: {
        application: {
          include: {
            student: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });

    if (!visa)
      throw new NotFoundException(
        `Visa with ID ${editUnitedStatesVisaDto.id} not found.`,
      );

    await this.checkApplicationStatus(visa.application.id);

    const changes: string[] = [];

    if (
      editUnitedStatesVisaDto.requiredDocumentsRequested &&
      editUnitedStatesVisaDto.requiredDocumentsRequested !==
        visa.requiredDocumentsRequested
    ) {
      changes.push(`Required documents requested`);

      const createNotificationDto = new CreateNotificationDto();
      createNotificationDto.title = `Visa Application`;
      createNotificationDto.content = `You are requested to bring the required documents for your visa process. Please go to your progress tab, find your application and bring the required documents in person. Contact your agent for more information.`;
      createNotificationDto.recipientId = visa.application.student.user.id;

      await this.notificationService.sendNotification(createNotificationDto);
    }

    if (
      editUnitedStatesVisaDto.requiredDocumentsReceived &&
      editUnitedStatesVisaDto.requiredDocumentsReceived !==
        visa.requiredDocumentsReceived
    ) {
      changes.push(`Required documents received`);
    }

    if (
      visa.visaApplicationStatus == UnitedStatesVisaApplicationStatus.Pending
    ) {
      await this.database.$transaction(async () => {
        const updatedVisa = await this.database.unitedStatesVisa.update({
          where: { id: editUnitedStatesVisaDto.id },
          data: {
            requiredDocumentsRequested:
              editUnitedStatesVisaDto.requiredDocumentsRequested,
            requiredDocumentsReceived:
              editUnitedStatesVisaDto.requiredDocumentsReceived,
            updatedAt: new Date(Date.now()),
          },
        });

        await this.database.unitedStatesVisa.update({
          where: { id: editUnitedStatesVisaDto.id },
          data: {
            visaApplicationStatus:
              updatedVisa.requiredDocumentsRequested &&
              updatedVisa.requiredDocumentsReceived
                ? UnitedStatesVisaApplicationStatus.DocumentsReceived
                : updatedVisa.visaApplicationStatus,
            updatedAt: new Date(Date.now()),
          },
        });

        await this.auditService.createAudit({
          entity: 'Untied States Visa',
          operation: Operation.Update,
          recordId: visa.application.id,
          userId: user.id,
          previousValues: JSON.stringify(
            plainToInstance(UnitedStatesVisaDto, visa, {
              excludeExtraneousValues: true,
            }),
          ),
          detail: changes.join(`\n`),
        });
      });
    } else
      throw new BadRequestException(
        `Visa status in: ${visa.visaApplicationStatus}`,
      );
  }

  async editVisaFeePaymentStatus(
    editUnitedStatesVisaDto: EditUnitedStatesVisaDto,
    user: EmployeeUserDto,
  ): Promise<void> {
    const visa = await this.database.unitedStatesVisa.findUnique({
      where: { id: editUnitedStatesVisaDto.id },
      include: {
        application: {
          include: {
            student: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });

    if (!visa)
      throw new NotFoundException(
        `Visa with ID ${editUnitedStatesVisaDto.id} not found.`,
      );

    await this.checkApplicationStatus(visa.application.id);

    if (
      visa.visaApplicationStatus ==
      UnitedStatesVisaApplicationStatus.VisaFeeFileUploaded
    ) {
      await this.database.$transaction(async () => {
        const updatedVisa = await this.database.unitedStatesVisa.update({
          where: { id: editUnitedStatesVisaDto.id },
          data: {
            visaFeePaymentStatus: editUnitedStatesVisaDto.visaFeePaymentStatus,
            updatedAt: new Date(Date.now()),
          },
        });

        await this.database.unitedStatesVisa.update({
          where: { id: editUnitedStatesVisaDto.id },
          data: {
            visaApplicationStatus:
              updatedVisa.visaFeePaymentStatus == VisaPaymentStatus.Paid
                ? UnitedStatesVisaApplicationStatus.VisaFeePaid
                : updatedVisa.visaApplicationStatus,
            updatedAt: new Date(Date.now()),
          },
        });

        if (
          editUnitedStatesVisaDto.visaFeePaymentStatus !==
          visa.visaFeePaymentStatus
        )
          await this.auditService.createAudit({
            entity: 'Untied States Visa',
            operation: Operation.Update,
            recordId: visa.application.id,
            userId: user.id,
            previousValues: JSON.stringify(
              plainToInstance(UnitedStatesVisaDto, visa, {
                excludeExtraneousValues: true,
              }),
            ),
            detail: `Visa fee payment status updated from ${visa.visaFeePaymentStatus} to ${editUnitedStatesVisaDto.visaFeePaymentStatus}`,
          });

        const createNotificationDto = new CreateNotificationDto();
        createNotificationDto.title = `Visa Application`;
        createNotificationDto.content = `Visa fee payment status updated from ${visa.visaFeePaymentStatus} to ${editUnitedStatesVisaDto.visaFeePaymentStatus}`;
        createNotificationDto.recipientId = visa.application.student.user.id;

        await this.notificationService.sendNotification(createNotificationDto);
      });
    } else
      throw new BadRequestException(
        `Visa status in: ${visa.visaApplicationStatus}`,
      );
  }

  async uploadVisaFeeFile(
    id: string,
    filename: string,
    user: EmployeeUserDto,
  ): Promise<void> {
    try {
      const visa = await this.database.unitedStatesVisa.findUnique({
        where: { id: id },
        include: {
          application: {
            include: {
              student: {
                include: {
                  user: true,
                },
              },
            },
          },
        },
      });

      await this.checkApplicationStatus(visa.application.id);

      if (visa.visaFeeFileUri) {
        await this.fileService.deleteFileAsync(visa.visaFeeFileUri);
      }

      if (
        visa.visaApplicationStatus ==
        UnitedStatesVisaApplicationStatus.DocumentsReceived
      ) {
        await this.database.unitedStatesVisa.update({
          where: { id: id },
          data: {
            visaFeeFileUri: filename,
            visaApplicationStatus:
              UnitedStatesVisaApplicationStatus.VisaFeeFileUploaded,
            updatedAt: new Date(Date.now()),
          },
        });

        await this.auditService.createAudit({
          entity: 'United States Visa',
          operation: Operation.Update,
          recordId: visa.application.id,
          userId: user.id,
          previousValues: JSON.stringify(
            plainToInstance(UnitedStatesVisaDto, visa, {
              excludeExtraneousValues: true,
            }),
          ),
          detail: `Visa fee file uploaded`,
        });

        const createNotificationDto = new CreateNotificationDto();
        createNotificationDto.title = `Visa Application`;
        createNotificationDto.content = `Your visa fee payment file is uploaded and is available to download. Contact your agent for more info.`;
        createNotificationDto.recipientId = visa.application.student.user.id;

        await this.notificationService.sendNotification(createNotificationDto);
      } else
        throw new BadRequestException(
          `Visa status in: ${visa.visaApplicationStatus}`,
        );
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async getVisaFeeFile(id: string): Promise<string> {
    try {
      const visa = await this.database.unitedStatesVisa.findUnique({
        where: { id: id },
        include: { application: true },
      });

      if (!visa) throw new NotFoundException(`Visa with ID ${id} not found.`);

      await this.checkApplicationStatus(visa.application.id);

      if (!visa.visaFeeFileUri)
        throw new NotFoundException(`Visa image for visa ID ${id} not found.`);

      const filePath = `${visa.visaFeeFileUri}`;

      if (!(await this.fileService.fileExistsAsync(filePath)))
        throw new NotFoundException(`File doesn't exist for ${id}`);

      return visa.visaFeeFileUri;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async editInterviewSchedule(
    editUnitedStatesVisaDto: EditUnitedStatesVisaDto,
    user: EmployeeUserDto,
  ): Promise<void> {
    try {
      const visa = await this.database.unitedStatesVisa.findUnique({
        where: { id: editUnitedStatesVisaDto.id },
        include: {
          application: {
            include: {
              student: {
                include: {
                  user: true,
                },
              },
            },
          },
        },
      });

      if (!visa)
        throw new NotFoundException(
          `Visa with ID ${editUnitedStatesVisaDto.id} not found.`,
        );

      await this.checkApplicationStatus(visa.application.id);

      if (
        visa.visaApplicationStatus ==
          UnitedStatesVisaApplicationStatus.VisaFeePaid ||
        visa.visaApplicationStatus ==
          UnitedStatesVisaApplicationStatus.InterviewScheduled ||
        visa.visaApplicationStatus ==
          UnitedStatesVisaApplicationStatus.DepositPaymentPending
      ) {
        await this.database.$transaction(async () => {
          const changes: string[] = [];

          if (
            editUnitedStatesVisaDto.interviewSchedule &&
            visa.interviewSchedule !== editUnitedStatesVisaDto.interviewSchedule
          ) {
            changes.push(
              `Interview schedule updated from ${visa.interviewSchedule} -> ${editUnitedStatesVisaDto.interviewSchedule}`,
            );
          }

          if (
            editUnitedStatesVisaDto.interviewAttended &&
            visa.interviewAttended !== editUnitedStatesVisaDto.interviewAttended
          ) {
            changes.push(
              `Interview attended status updated from ${visa.interviewAttended ? 'Attended' : 'Not Attended'} -> ${editUnitedStatesVisaDto.interviewAttended ? 'Attended' : 'Not Attended'}`,
            );
          }

          // 21 days before interview
          const serviceFeeDepositDate = new Date(
            editUnitedStatesVisaDto.interviewSchedule.getTime() -
              21 * 24 * 60 * 60 * 1000,
          );

          const updatedVisa = await this.database.unitedStatesVisa.update({
            where: { id: editUnitedStatesVisaDto.id },
            data: {
              visaApplicationStatus:
                UnitedStatesVisaApplicationStatus.DepositPaymentPending,
              interviewSchedule: editUnitedStatesVisaDto.interviewSchedule,
              serviceFeeDepositDate: serviceFeeDepositDate,
              updatedAt: new Date(Date.now()),
            },
          });

          await this.auditService.createAudit({
            entity: 'United States Visa',
            operation: Operation.Update,
            recordId: visa.application.id,
            userId: user.id,
            previousValues: JSON.stringify(
              plainToInstance(UnitedStatesVisaDto, visa, {
                excludeExtraneousValues: true,
              }),
            ),
            detail: changes.join(`\n`),
          });

          if (
            visa.interviewSchedule !== editUnitedStatesVisaDto.interviewSchedule
          ) {
            const createNotificationDto = new CreateNotificationDto();
            createNotificationDto.title = `Visa Application`;
            createNotificationDto.content = `Your visa interview schedule has been updated.`;
            createNotificationDto.recipientId =
              visa.application.student.user.id;

            await this.notificationService.sendNotification(
              createNotificationDto,
            );
          }

          if (
            visa.interviewSchedule &&
            visa.interviewSchedule !== editUnitedStatesVisaDto.interviewSchedule
          ) {
            const editCalendarDto = new EditCalendarDto();
            editCalendarDto.externalId = `Interview-${visa.application.id}`;
            editCalendarDto.startDate = updatedVisa.interviewSchedule;
            editCalendarDto.endDate = updatedVisa.interviewSchedule;
            editCalendarDto.applicationId = visa.application.id;

            const visaUser = await this.database.employee.findUnique({
              where: {
                id: visa.application.visaId,
              },
              include: {
                user: true,
              },
            });

            if (updatedVisa.interviewAttended)
              editCalendarDto.isAttended = true;

            const user = plainToInstance(UserDto, visaUser, {
              excludeExtraneousValues: true,
            });

            await this.calendarService.editCalendar(editCalendarDto, user);
          } else {
            const student = await this.database.student.findUnique({
              where: {
                id: visa.application.studentId,
              },
            });

            const application = await this.database.application.findUnique({
              where: {
                id: visa.application.id,
              },
            });

            const employee = await this.database.employee.findUnique({
              where: {
                id: visa.application.visaId,
              },
              include: {
                user: true,
              },
            });

            const createInterviewCalendarDto = new CreateCalendarDto();
            createInterviewCalendarDto.startDate = new Date(
              updatedVisa.interviewSchedule,
            );
            createInterviewCalendarDto.endDate = new Date(
              updatedVisa.interviewSchedule,
            );
            createInterviewCalendarDto.externalId = `Interview-${visa.application.id}`;
            createInterviewCalendarDto.title = `Visa Interview (${student.firstName} ${student.lastName})`;
            createInterviewCalendarDto.description = `Application Country: ${application.country}\nField of Study: ${application.fieldOfStudy} \nEducational Level: ${application.educationalLevel}`;
            createInterviewCalendarDto.eventCategory = EventCategory.Visa;
            createInterviewCalendarDto.color = CalendarColor.Interview;
            createInterviewCalendarDto.applicationId = visa.application.id;
            createInterviewCalendarDto.employeeId = visa.application.visaId;
            createInterviewCalendarDto.googleColor =
              CalendarColor.InterviewGoogle;

            await this.calendarService.createCalendar(
              createInterviewCalendarDto,
              plainToInstance(UserDto, employee.user, {
                excludeExtraneousValues: true,
              }),
            );

            const createServiceFeeDepositDateCalendarDto =
              new CreateCalendarDto();
            createServiceFeeDepositDateCalendarDto.startDate = new Date(
              updatedVisa.serviceFeeDepositDate,
            );
            createServiceFeeDepositDateCalendarDto.endDate = new Date(
              updatedVisa.serviceFeeDepositDate,
            );
            createServiceFeeDepositDateCalendarDto.externalId = `Service-Fee-Deposit-${visa.application.id}`;
            createServiceFeeDepositDateCalendarDto.title = `Service Fee Deposit (${student.firstName} ${student.lastName})`;
            createServiceFeeDepositDateCalendarDto.description = `Application Country: ${application.country}\nField of Study: ${application.fieldOfStudy} \nEducational Level: ${application.educationalLevel}`;
            createServiceFeeDepositDateCalendarDto.eventCategory =
              EventCategory.Visa;
            createServiceFeeDepositDateCalendarDto.color =
              CalendarColor.UnitedStatesServiceFee;
            createServiceFeeDepositDateCalendarDto.applicationId =
              visa.application.id;
            createServiceFeeDepositDateCalendarDto.employeeId =
              visa.application.visaId;
            createServiceFeeDepositDateCalendarDto.googleColor =
              CalendarColor.UnitedStatesServiceFeeGoogle;

            await this.calendarService.createCalendar(
              createServiceFeeDepositDateCalendarDto,
              plainToInstance(UserDto, employee.user, {
                excludeExtraneousValues: true,
              }),
            );
          }

          if (
            visa.serviceFeeDepositDate &&
            visa.serviceFeeDepositDate !== updatedVisa.serviceFeeDepositDate
          ) {
            const editCalendarDto = new EditCalendarDto();
            editCalendarDto.externalId = `Service-Fee-Deposit-${visa.application.id}`;
            editCalendarDto.startDate = updatedVisa.serviceFeeDepositDate;
            editCalendarDto.endDate = updatedVisa.serviceFeeDepositDate;
            editCalendarDto.applicationId = visa.application.id;

            const visaUser = await this.database.employee.findUnique({
              where: {
                id: visa.application.visaId,
              },
              include: {
                user: true,
              },
            });

            if (
              updatedVisa.serviceFeeDepositPaymentStatus ==
              DepositPaymentStatus.Paid
            )
              editCalendarDto.isAttended = true;

            const user = plainToInstance(UserDto, visaUser, {
              excludeExtraneousValues: true,
            });

            await this.calendarService.editCalendar(editCalendarDto, user);
          }
        });
      } else {
        throw new BadRequestException(
          `Visa status in: ${visa.visaApplicationStatus}`,
        );
      }
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async createInterviewTrainingSchedule(
    createInterviewTrainingScheduleDto: CreateInterviewTrainingScheduleDto,
    user: EmployeeUserDto,
  ): Promise<void> {
    try {
      const visa = await this.database.unitedStatesVisa.findUnique({
        where: { id: createInterviewTrainingScheduleDto.unitedStatesVisaId },
        include: {
          application: {
            include: {
              student: {
                include: {
                  user: true,
                },
              },
            },
          },
        },
      });

      if (!visa)
        throw new NotFoundException(
          `Visa with ID ${createInterviewTrainingScheduleDto.unitedStatesVisaId} not found.`,
        );

      await this.checkApplicationStatus(visa.application.id);

      if (
        visa.visaApplicationStatus ==
          UnitedStatesVisaApplicationStatus.InterviewScheduled ||
        visa.visaApplicationStatus ==
          UnitedStatesVisaApplicationStatus.DepositPaymentPending
      ) {
        await this.database.$transaction(async () => {
          // ! Check if maximum number of interviews has been reached
          // const interviewsCount =
          //   await this.database.interviewTrainingSchedule.count({
          //     where: {
          //       unitedStatesVisaId:
          //         createInterviewTrainingScheduleDto.unitedStatesVisaId,
          //     },
          //   });

          // if (interviewsCount > 2) {
          //   throw new BadRequestException(
          //     `Maximum number of interviews reached.`,
          //   );
          // }

          const interviewTrainingSchedule =
            await this.database.interviewTrainingSchedule.create({
              data: {
                date: createInterviewTrainingScheduleDto.date,
                status: InterviewScheduleStatus.Pending,
                unitedStatesVisa: {
                  connect: {
                    id: createInterviewTrainingScheduleDto.unitedStatesVisaId,
                  },
                },
              },
            });

          const student = await this.database.student.findUnique({
            where: {
              id: visa.application.studentId,
            },
          });

          const application = await this.database.application.findUnique({
            where: {
              id: visa.application.id,
            },
          });

          await this.auditService.createAudit({
            entity: 'Interview Training Schedule',
            operation: Operation.Create,
            recordId: visa.application.id,
            userId: user.id,
            previousValues: null,
          });

          const createNotificationDto = new CreateNotificationDto();
          createNotificationDto.title = `Visa Application`;
          createNotificationDto.content = `You have an interview training on ${createInterviewTrainingScheduleDto.date}. Contact your agent for more info.`;
          createNotificationDto.recipientId = visa.application.student.user.id;

          await this.notificationService.sendNotification(
            createNotificationDto,
          );

          const createCalendarDto = new CreateCalendarDto();
          createCalendarDto.startDate = new Date(
            createInterviewTrainingScheduleDto.date,
          );
          createCalendarDto.endDate = new Date(
            createInterviewTrainingScheduleDto.date,
          );
          createCalendarDto.externalId = `Interview-Training-${interviewTrainingSchedule.id}`;
          createCalendarDto.title = `Interview Training (${student.firstName} ${student.lastName})`;
          createCalendarDto.description = `Application Country: ${application.country}\nField of Study: ${application.fieldOfStudy} \nEducational Level: ${application.educationalLevel}`;
          createCalendarDto.eventCategory = EventCategory.Visa;
          createCalendarDto.color = CalendarColor.InterviewTraining;
          createCalendarDto.applicationId = visa.application.id;
          createCalendarDto.employeeId = visa.application.visaId;
          createCalendarDto.googleColor = CalendarColor.InterviewTrainingGoogle;

          const employee = await this.database.employee.findUnique({
            where: {
              id: visa.application.visaId,
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
      } else {
        throw new BadRequestException(
          `Visa status in: ${visa.visaApplicationStatus}`,
        );
      }
    } catch (error) {
      console.error(error);
      if (error.code === 'P2002')
        throw new BadRequestException(`${error.meta.target} already exists`);
      else if (error.code === 'P2025')
        throw new BadRequestException(`${error.meta.cause}`);
      throw error;
    }
  }

  async editInterviewTrainingSchedule(
    editInterviewTrainingScheduleDto: EditInterviewTrainingScheduleDto,
    user: EmployeeUserDto,
  ): Promise<void> {
    try {
      const interviewTrainingSchedule =
        await this.database.interviewTrainingSchedule.findUnique({
          where: { id: editInterviewTrainingScheduleDto.id },
          include: {
            unitedStatesVisa: {
              include: {
                application: {
                  include: {
                    student: {
                      include: {
                        user: true,
                      },
                    },
                  },
                },
              },
            },
          },
        });

      if (!interviewTrainingSchedule)
        throw new NotFoundException(
          `Interview training schedule with ID ${editInterviewTrainingScheduleDto.id} not found.`,
        );

      await this.checkApplicationStatus(
        interviewTrainingSchedule.unitedStatesVisa.application.id,
      );

      if (
        interviewTrainingSchedule.unitedStatesVisa.visaApplicationStatus ==
          UnitedStatesVisaApplicationStatus.InterviewScheduled ||
        interviewTrainingSchedule.unitedStatesVisa.visaApplicationStatus ==
          UnitedStatesVisaApplicationStatus.DepositPaymentPending
      ) {
        await this.database.$transaction(async () => {
          const changes: string[] = [];

          if (
            editInterviewTrainingScheduleDto.date &&
            interviewTrainingSchedule.date !==
              editInterviewTrainingScheduleDto.date
          ) {
            changes.push(
              `Date updated from ${interviewTrainingSchedule.date} -> ${editInterviewTrainingScheduleDto.date}`,
            );
          }

          if (
            editInterviewTrainingScheduleDto &&
            interviewTrainingSchedule.status !==
              editInterviewTrainingScheduleDto.status
          ) {
            changes.push(
              `Status updated from ${interviewTrainingSchedule.status} -> ${editInterviewTrainingScheduleDto.status}`,
            );
          }

          const updatedInterviewTrainingSchedule =
            await this.database.interviewTrainingSchedule.update({
              where: { id: editInterviewTrainingScheduleDto.id },
              data: {
                date: editInterviewTrainingScheduleDto.date,
                status: editInterviewTrainingScheduleDto.status,
                updatedAt: new Date(Date.now()),
              },
              include: {
                unitedStatesVisa: {
                  include: {
                    application: true,
                  },
                },
              },
            });

          await this.auditService.createAudit({
            entity: 'Interview Training Schedule',
            operation: Operation.Update,
            recordId: interviewTrainingSchedule.unitedStatesVisa.application.id,
            userId: user.id,
            previousValues: JSON.stringify(
              plainToInstance(
                InterviewTrainingScheduleDto,
                interviewTrainingSchedule,
                {
                  excludeExtraneousValues: true,
                },
              ),
            ),
            detail: changes.join(`\n`),
          });

          if (changes.length > 0) {
            const createNotificationDto = new CreateNotificationDto();
            createNotificationDto.title = `Visa Application`;
            createNotificationDto.content = `Interview training schedule updated.`;
            createNotificationDto.recipientId =
              interviewTrainingSchedule.unitedStatesVisa.application.student.user.id;

            await this.notificationService.sendNotification(
              createNotificationDto,
            );
          }

          if (
            interviewTrainingSchedule.date !==
            editInterviewTrainingScheduleDto.date
          ) {
            const editCalendarDto = new EditCalendarDto();
            editCalendarDto.externalId = `Interview-Training-${interviewTrainingSchedule.id}`;
            editCalendarDto.startDate = updatedInterviewTrainingSchedule.date;
            editCalendarDto.endDate = updatedInterviewTrainingSchedule.date;
            editCalendarDto.applicationId =
              interviewTrainingSchedule.unitedStatesVisa.application.id;

            const visa = await this.database.employee.findUnique({
              where: {
                id: interviewTrainingSchedule.unitedStatesVisa.application
                  .visaId,
              },
              include: {
                user: true,
              },
            });

            if (
              updatedInterviewTrainingSchedule.status ===
              InterviewScheduleStatus.Attended
            )
              editCalendarDto.isAttended = true;

            const user = plainToInstance(UserDto, visa, {
              excludeExtraneousValues: true,
            });

            await this.calendarService.editCalendar(editCalendarDto, user);
          }
        });
      } else {
        throw new BadRequestException(
          `Visa status in: ${interviewTrainingSchedule.unitedStatesVisa.visaApplicationStatus}`,
        );
      }
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async editInterviewTrainingScheduleStatus(
    editUnitedStatesVisaDto: EditUnitedStatesVisaDto,
    user: EmployeeUserDto,
  ): Promise<void> {
    try {
      const visa = await this.database.unitedStatesVisa.findUnique({
        where: { id: editUnitedStatesVisaDto.id },
        include: {
          application: true,
          interviewTrainingSchedules: true,
        },
      });

      if (!visa)
        throw new NotFoundException(
          `Visa with ID ${editUnitedStatesVisaDto.id} not found.`,
        );

      // ! Uncomment this if you want to check if the student has interview training schedules or not before changing interviewTrainingScheduleComplete
      // if (visa.interviewTrainingSchedules.length === 0)
      //   throw new BadRequestException(
      //     `No interview training schedules found for Visa with ID ${editUnitedStatesVisaDto.id}.`,
      //   );

      await this.checkApplicationStatus(visa.application.id);

      if (
        visa.visaApplicationStatus ==
          UnitedStatesVisaApplicationStatus.InterviewScheduled ||
        visa.visaApplicationStatus ==
          UnitedStatesVisaApplicationStatus.DepositPaymentPending ||
        visa.visaApplicationStatus ==
          UnitedStatesVisaApplicationStatus.DepositPaymentComplete
      ) {
        await this.database.unitedStatesVisa.update({
          where: { id: editUnitedStatesVisaDto.id },
          data: {
            interviewTrainingScheduleComplete:
              editUnitedStatesVisaDto.interviewTrainingScheduleComplete,
            updatedAt: new Date(Date.now()),
          },
        });

        if (
          editUnitedStatesVisaDto.interviewTrainingScheduleComplete !==
          visa.interviewTrainingScheduleComplete
        )
          await this.auditService.createAudit({
            entity: 'United States Visa',
            operation: Operation.Update,
            recordId: visa.application.id,
            userId: user.id,
            previousValues: JSON.stringify(
              plainToInstance(UnitedStatesVisaDto, visa, {
                excludeExtraneousValues: true,
              }),
            ),
            detail: `Interview training schedule status updated from ${visa.interviewTrainingScheduleComplete ? 'Complete' : 'Scheduled'} -> ${editUnitedStatesVisaDto.interviewTrainingScheduleComplete ? 'Complete' : 'Scheduled'}`,
          });
      } else {
        throw new BadRequestException(
          `Visa status in: ${visa.visaApplicationStatus}`,
        );
      }
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async editServiceFeeDepositPaymentStatus(
    editUnitedStatesVisaDto: EditUnitedStatesVisaDto,
    user: EmployeeUserDto,
  ): Promise<void> {
    try {
      const visa = await this.database.unitedStatesVisa.findUnique({
        where: { id: editUnitedStatesVisaDto.id },
        include: { application: true },
      });

      if (!visa)
        throw new NotFoundException(
          `Visa with ID ${editUnitedStatesVisaDto.id} not found.`,
        );

      await this.checkApplicationStatus(visa.application.id);

      if (
        visa.visaApplicationStatus ==
        UnitedStatesVisaApplicationStatus.DepositPaymentPending
      ) {
        const updatedVisa = await this.database.unitedStatesVisa.update({
          where: { id: editUnitedStatesVisaDto.id },
          data: {
            serviceFeeDepositPaymentStatus:
              editUnitedStatesVisaDto.serviceFeeDepositPaymentStatus,
            visaApplicationStatus:
              editUnitedStatesVisaDto.serviceFeeDepositPaymentStatus ===
              DepositPaymentStatus.Paid
                ? UnitedStatesVisaApplicationStatus.DepositPaymentComplete
                : UnitedStatesVisaApplicationStatus.DepositPaymentPending,
            updatedAt: new Date(Date.now()),
          },
        });

        if (
          visa.serviceFeeDepositDate &&
          visa.serviceFeeDepositDate !== updatedVisa.serviceFeeDepositDate
        ) {
          const editCalendarDto = new EditCalendarDto();
          editCalendarDto.externalId = `Service-Fee-Deposit-${visa.application.id}`;
          editCalendarDto.startDate = updatedVisa.serviceFeeDepositDate;
          editCalendarDto.endDate = updatedVisa.serviceFeeDepositDate;
          editCalendarDto.applicationId = updatedVisa.applicationId;

          const visaUser = await this.database.employee.findUnique({
            where: {
              id: visa.application.visaId,
            },
            include: {
              user: true,
            },
          });

          if (
            updatedVisa.serviceFeeDepositPaymentStatus ==
            DepositPaymentStatus.Paid
          )
            editCalendarDto.isAttended = true;

          const user = plainToInstance(UserDto, visaUser, {
            excludeExtraneousValues: true,
          });

          await this.calendarService.editCalendar(editCalendarDto, user);
        }

        await this.auditService.createAudit({
          entity: 'United States Visa',
          operation: Operation.Update,
          recordId: visa.application.id,
          userId: user.id,
          previousValues: JSON.stringify(
            plainToInstance(UnitedStatesVisaDto, visa, {
              excludeExtraneousValues: true,
            }),
          ),
          detail: `Service fee deposit payment status updated from ${visa.serviceFeeDepositPaymentStatus ? 'Paid' : 'Pending'} -> ${editUnitedStatesVisaDto.serviceFeeDepositPaymentStatus ? 'Paid' : 'Pending'}`,
        });
      } else
        throw new BadRequestException(
          `Visa status in: ${visa.visaApplicationStatus}`,
        );
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async editInterviewScheduleStatus(
    editUnitedStatesVisaDto: EditUnitedStatesVisaDto,
    user: EmployeeUserDto,
  ): Promise<void> {
    try {
      const visa = await this.database.unitedStatesVisa.findUnique({
        where: { id: editUnitedStatesVisaDto.id },
        include: { application: true },
      });

      if (!visa)
        throw new NotFoundException(
          `Visa with ID ${editUnitedStatesVisaDto.id} not found.`,
        );

      await this.checkApplicationStatus(visa.application.id);

      if (
        visa.visaApplicationStatus ==
        UnitedStatesVisaApplicationStatus.DepositPaymentComplete
      ) {
        await this.database.unitedStatesVisa.update({
          where: { id: editUnitedStatesVisaDto.id },
          data: {
            interviewAttended: editUnitedStatesVisaDto.interviewAttended,
            visaApplicationStatus: editUnitedStatesVisaDto.interviewAttended
              ? UnitedStatesVisaApplicationStatus.InterviewComplete
              : visa.visaApplicationStatus,
            updatedAt: new Date(Date.now()),
          },
        });

        if (
          editUnitedStatesVisaDto.interviewAttended !== visa.interviewAttended
        )
          await this.auditService.createAudit({
            entity: 'United States Visa',
            operation: Operation.Update,
            recordId: visa.application.id,
            userId: user.id,
            previousValues: JSON.stringify(
              plainToInstance(UnitedStatesVisaDto, visa, {
                excludeExtraneousValues: true,
              }),
            ),
            detail: `Interview schedule status updated from ${visa.interviewAttended ? 'Complete' : 'Scheduled'} -> ${editUnitedStatesVisaDto.interviewAttended ? 'Complete' : 'Scheduled'}`,
          });
      } else {
        throw new BadRequestException(
          `Visa status in: ${visa.visaApplicationStatus}`,
        );
      }
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async editSevisPayment(
    editUnitedStatesVisaDto: EditUnitedStatesVisaDto,
    user: EmployeeUserDto,
  ): Promise<void> {
    try {
      const visa = await this.database.unitedStatesVisa.findUnique({
        where: { id: editUnitedStatesVisaDto.id },
        include: { application: true },
      });

      if (!visa)
        throw new NotFoundException(
          `Visa with ID ${editUnitedStatesVisaDto.id} not found.`,
        );

      await this.checkApplicationStatus(visa.application.id);

      if (
        visa.visaApplicationStatus ==
        UnitedStatesVisaApplicationStatus.InterviewComplete
      ) {
        const updatedVisa = await this.database.unitedStatesVisa.update({
          where: { id: editUnitedStatesVisaDto.id },
          data: {
            sevisPaymentStatus: editUnitedStatesVisaDto.sevisPaymentStatus,
            visaApplicationStatus:
              editUnitedStatesVisaDto.sevisPaymentStatus ==
              VisaPaymentStatus.Paid
                ? UnitedStatesVisaApplicationStatus.SevisPaid
                : visa.visaApplicationStatus,
            updatedAt: new Date(Date.now()),
          },
        });

        if (updatedVisa.sevisPaymentStatus == VisaPaymentStatus.Paid)
          await this.database.application.update({
            where: { id: visa.applicationId },
            data: {
              applicationStatus: ApplicationStatus.VisaDecision,
            },
          });

        if (
          editUnitedStatesVisaDto.sevisPaymentStatus !== visa.sevisPaymentStatus
        )
          await this.auditService.createAudit({
            entity: 'United States Visa',
            operation: Operation.Update,
            recordId: visa.application.id,
            userId: user.id,
            previousValues: JSON.stringify(
              plainToInstance(UnitedStatesVisaDto, visa, {
                excludeExtraneousValues: true,
              }),
            ),
            detail: `Sevis payment status updated from ${visa.sevisPaymentStatus} -> ${editUnitedStatesVisaDto.sevisPaymentStatus}`,
          });
      } else {
        throw new BadRequestException(
          `Visa status in: ${visa.visaApplicationStatus}`,
        );
      }
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async editUnitedStatesVisaApplicationStatus(
    editUnitedStatesVisaDto: EditUnitedStatesVisaDto,
    user: EmployeeUserDto,
  ): Promise<void> {
    const visa = await this.database.unitedStatesVisa.findUnique({
      where: { id: editUnitedStatesVisaDto.id },
      include: { application: true },
    });

    if (!visa) {
      throw new NotFoundException(
        `Visa with ID ${editUnitedStatesVisaDto.id} not found.`,
      );
    }

    await this.checkApplicationStatus(visa.application.id);

    const allowedTransitions = {
      [UnitedStatesVisaApplicationStatus.InterviewTrainingScheduled]:
        UnitedStatesVisaApplicationStatus.InterviewTrainingComplete,
      [UnitedStatesVisaApplicationStatus.DepositPaymentComplete]:
        UnitedStatesVisaApplicationStatus.InterviewComplete,
      [UnitedStatesVisaApplicationStatus.VisaFeeFileUploaded]:
        UnitedStatesVisaApplicationStatus.VisaFeePaid,
    };

    if (
      !allowedTransitions[visa.visaApplicationStatus] ||
      editUnitedStatesVisaDto.visaApplicationStatus !==
        allowedTransitions[visa.visaApplicationStatus]
    ) {
      throw new BadRequestException(
        `Invalid visa status transition: ${visa.visaApplicationStatus} to ${editUnitedStatesVisaDto.visaApplicationStatus}`,
      );
    }

    await this.database.unitedStatesVisa.update({
      where: { id: editUnitedStatesVisaDto.id },
      data: {
        visaApplicationStatus: editUnitedStatesVisaDto.visaApplicationStatus,
        updatedAt: new Date(Date.now()),
      },
    });

    await this.auditService.createAudit({
      entity: 'United States Visa',
      operation: Operation.Update,
      recordId: visa.application.id,
      userId: user.id,
      previousValues: JSON.stringify(
        plainToInstance(UnitedStatesVisaDto, visa, {
          excludeExtraneousValues: true,
        }),
      ),
    });
  }

  async editVisaStatus(
    editUnitedStatesVisaDto: EditUnitedStatesVisaDto,
    user: EmployeeUserDto,
  ): Promise<void> {
    const visa = await this.database.unitedStatesVisa.findUnique({
      where: { id: editUnitedStatesVisaDto.id },
      include: {
        application: {
          include: {
            student: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });

    if (!visa)
      throw new NotFoundException(
        `Visa with ID ${editUnitedStatesVisaDto.id} not found.`,
      );

    if (visa.application.applicationStatus !== ApplicationStatus.VisaDecision) {
      throw new BadRequestException(
        `Application is in ${visa.application?.applicationStatus} status.`,
      );
    }

    if (
      visa.visaApplicationStatus == UnitedStatesVisaApplicationStatus.SevisPaid
    ) {
      const notificationDto = new CreateNotificationDto();
      if (editUnitedStatesVisaDto.visaAccepted) {
        notificationDto.title = 'Visa Accepted';
        notificationDto.content =
          'Your visa has been accepted! Please contact your agent for further instructions.';
        notificationDto.recipientId = visa.application.student.user.id;

        await this.notificationService.sendNotification(notificationDto);
      } else {
        notificationDto.title = 'Visa Rejected';
        notificationDto.content =
          'Your visa has been rejected! Please contact your agent for further instructions.';
        notificationDto.recipientId = visa.application.student.user.id;

        await this.notificationService.sendNotification(notificationDto);
      }

      await this.database.unitedStatesVisa.update({
        where: { id: editUnitedStatesVisaDto.id },
        data: {
          visaAccepted: editUnitedStatesVisaDto.visaAccepted,
          visaStatusNotificationSent: true,
          visaStatusNotificationSentAt: new Date(Date.now()),
          visaApplicationStatus: UnitedStatesVisaApplicationStatus.NotifiedUser,
          updatedAt: new Date(Date.now()),
        },
      });

      if (editUnitedStatesVisaDto.visaAccepted !== visa.visaAccepted)
        await this.auditService.createAudit({
          entity: 'United States Visa',
          operation: Operation.Update,
          recordId: visa.application.id,
          userId: user.id,
          previousValues: JSON.stringify(
            plainToInstance(UnitedStatesVisaDto, visa, {
              excludeExtraneousValues: true,
            }),
          ),
          detail: `Visa status updated from ${visa.visaAccepted ? 'Accepted' : 'Rejected'} -> ${editUnitedStatesVisaDto.visaAccepted ? 'Accepted' : 'Rejected'}`,
        });

      await this.database.calendar.updateMany({
        where: {
          application: { id: visa.application.id },
          eventCategory: EventCategory.Visa,
        },
        data: {
          isAttended: true,
        },
      });
    } else {
      throw new BadRequestException(
        `Visa status in: ${visa.visaApplicationStatus}`,
      );
    }
  }

  async deleteInterviewTrainingSchedule(
    id: string,
    user: EmployeeUserDto,
  ): Promise<void> {
    try {
      const interviewTrainingSchedule =
        await this.database.interviewTrainingSchedule.findUnique({
          where: { id: id },
          include: { unitedStatesVisa: { include: { application: true } } },
        });

      if (!interviewTrainingSchedule)
        throw new NotFoundException(
          `Interview training schedule with ID ${id} not found.`,
        );

      await this.checkApplicationStatus(
        interviewTrainingSchedule.unitedStatesVisa.application.id,
      );

      await this.database.$transaction(async () => {
        await this.database.interviewTrainingSchedule.delete({
          where: { id: id },
        });

        await this.database.calendar.delete({
          where: {
            externalId: `Interview-Training-${interviewTrainingSchedule.id}`,
          },
        });

        await this.auditService.createAudit({
          entity: 'Interview Training Schedule',
          operation: Operation.Delete,
          recordId: interviewTrainingSchedule.unitedStatesVisa.application.id,
          userId: user.id,
          previousValues: JSON.stringify(
            plainToInstance(
              InterviewTrainingScheduleDto,
              interviewTrainingSchedule,
              {
                excludeExtraneousValues: true,
              },
            ),
          ),
        });
      });
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
}
