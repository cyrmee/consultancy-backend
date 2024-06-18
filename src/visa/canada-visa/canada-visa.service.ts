import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CanadaVisaDto, EditCanadaVisaDto } from './dto';
import { plainToInstance } from 'class-transformer';
import {
  AdmissionStatus,
  ApplicationStatus,
  CanadaVisaApplicationStatus,
  DepositPaymentStatus,
  EventCategory,
  Operation,
  Role,
  VisaApplicationAndBiometricFeeStatus,
  VisaPaymentStatus,
} from '@prisma/client';
import { CreateNotificationDto } from '../../notification/dto';
import { NotificationService } from '../../notification/notification.service';
import { FileService } from '../../common/files.service';
import { AuditService } from '../../audit/audit.service';
import { EmployeeUserDto } from '../../auth/dto';
import { CreateCalendarDto, EditCalendarDto } from '../../calendar/dto';
import { UserDto } from '../../user/dto';
import { CalendarService } from '../../calendar/calendar.service';
import { CalendarColor } from '../../common/enums';

@Injectable()
export class CanadaVisaService {
  constructor(
    private readonly database: PrismaService,
    private readonly notificationService: NotificationService,
    private readonly fileService: FileService,
    private readonly auditService: AuditService,
    private readonly calendarService: CalendarService,
  ) {}

  async visaExists(id: string): Promise<boolean> {
    return (
      (await this.database.canadaVisa.findUnique({
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

  async getVisaByApplicationId(applicationId: string): Promise<CanadaVisaDto> {
    try {
      const visa = await this.database.canadaVisa.findUnique({
        where: { applicationId },
        include: {
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

      return plainToInstance(CanadaVisaDto, visa, {
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
  ): Promise<CanadaVisaDto> {
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

      const visa = await this.database.canadaVisa.findUnique({
        where: { applicationId },
        include: {
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

      if (visa.applicationConfirmationFileUri) {
        if (
          !(await this.fileService.fileExistsAsync(
            visa.applicationConfirmationFileUri,
          ))
        ) {
          visa.applicationConfirmationFileUri = '';
        }
      }

      if (visa.paymentConfirmationFileUri) {
        if (
          !(await this.fileService.fileExistsAsync(
            visa.paymentConfirmationFileUri,
          ))
        ) {
          visa.paymentConfirmationFileUri = '';
        }
      }

      return plainToInstance(CanadaVisaDto, visa, {
        excludeExtraneousValues: true,
      });
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async getVisaApplicationStatusById(
    id: string,
  ): Promise<CanadaVisaApplicationStatus> {
    try {
      const visa = await this.database.canadaVisa.findUnique({
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

  async editRequiredVisaDocuments(
    editCanadaVisaDto: EditCanadaVisaDto,
    user: EmployeeUserDto,
  ): Promise<void> {
    const visa = await this.database.canadaVisa.findUnique({
      where: { id: editCanadaVisaDto.id },
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
        `Visa with ID ${editCanadaVisaDto.id} not found.`,
      );

    await this.checkApplicationStatus(visa.application.id);

    const changes: string[] = [];

    if (
      editCanadaVisaDto.requiredDocumentsRequested &&
      visa.requiredDocumentsRequested !==
        editCanadaVisaDto.requiredDocumentsRequested
    ) {
      changes.push(`Required documents requested updated.`);

      const createNotificationDto = new CreateNotificationDto();
      createNotificationDto.title = `Visa Application`;
      createNotificationDto.content = `You are requested to bring the required documents for your visa process. Please go to your progress tab, find your application and bring the required documents in person. Contact your agent for more information.`;
      createNotificationDto.recipientId = visa.application.student.user.id;

      await this.notificationService.sendNotification(createNotificationDto);
    }

    if (
      editCanadaVisaDto.requiredDocumentsReceived &&
      visa.requiredDocumentsReceived !==
        editCanadaVisaDto.requiredDocumentsReceived
    ) {
      changes.push(`Required documents received updated.`);
    }

    if (visa.visaApplicationStatus == CanadaVisaApplicationStatus.Pending) {
      await this.database.$transaction(async () => {
        const updatedVisa = await this.database.canadaVisa.update({
          where: { id: editCanadaVisaDto.id },
          data: {
            requiredDocumentsRequested:
              editCanadaVisaDto.requiredDocumentsRequested,
            requiredDocumentsReceived:
              editCanadaVisaDto.requiredDocumentsReceived,
            updatedAt: new Date(Date.now()),
          },
        });

        await this.database.canadaVisa.update({
          where: { id: editCanadaVisaDto.id },
          data: {
            visaApplicationStatus:
              updatedVisa.requiredDocumentsRequested &&
              updatedVisa.requiredDocumentsReceived
                ? CanadaVisaApplicationStatus.DocumentsReceived
                : updatedVisa.visaApplicationStatus,
            updatedAt: new Date(Date.now()),
          },
        });

        await this.auditService.createAudit({
          entity: 'Canada Visa',
          operation: Operation.Update,
          recordId: visa.application.id,
          userId: user.id,
          previousValues: JSON.stringify(
            plainToInstance(CanadaVisaDto, visa, {
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

  async editVisaApplicationAndBiometricFeeAmount(
    editCanadaVisaDto: EditCanadaVisaDto,
    user: EmployeeUserDto,
  ): Promise<void> {
    const visa = await this.database.canadaVisa.findUnique({
      where: { id: editCanadaVisaDto.id },
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
        `Visa with ID ${editCanadaVisaDto.id} not found.`,
      );

    const changes: string[] = [];

    if (
      editCanadaVisaDto.visaApplicationAndBiometricFeeAmount &&
      visa.visaApplicationAndBiometricFeeAmount !==
        editCanadaVisaDto.visaApplicationAndBiometricFeeAmount
    ) {
      changes.push(
        `Visa application and biometric fee amount updated from ${visa.visaApplicationAndBiometricFeeAmount} to ${editCanadaVisaDto.visaApplicationAndBiometricFeeAmount}`,
      );
    }

    if (
      visa.visaApplicationStatus ==
      CanadaVisaApplicationStatus.DocumentsReceived
    ) {
      await this.database.$transaction(async () => {
        const updatedVisa = await this.database.canadaVisa.update({
          where: { id: editCanadaVisaDto.id },
          data: {
            visaApplicationAndBiometricFeeAmount:
              editCanadaVisaDto.visaApplicationAndBiometricFeeAmount,
            updatedAt: new Date(Date.now()),
          },
        });

        await this.database.canadaVisa.update({
          where: { id: editCanadaVisaDto.id },
          data: {
            visaApplicationStatus:
              updatedVisa.visaApplicationAndBiometricFeeAmount
                ? CanadaVisaApplicationStatus.VisaApplicationAndBiometricFeeAmountSet
                : updatedVisa.visaApplicationStatus,
            updatedAt: new Date(Date.now()),
          },
        });

        const createNotificationDto = new CreateNotificationDto();
        createNotificationDto.title = 'Visa Application';
        createNotificationDto.content = `Visa application and biometric fee amount updated from ${visa.visaApplicationAndBiometricFeeAmount} to ${editCanadaVisaDto.visaApplicationAndBiometricFeeAmount}`;
        createNotificationDto.recipientId = visa.application.student.user.id;

        await this.notificationService.sendNotification(createNotificationDto);

        await this.auditService.createAudit({
          entity: 'Canada Visa',
          operation: Operation.Update,
          recordId: visa.application.id,
          userId: user.id,
          previousValues: JSON.stringify(
            plainToInstance(CanadaVisaDto, visa, {
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

  async editVisaApplicationAndBiometricFeePaymentStatus(
    editCanadaVisaDto: EditCanadaVisaDto,
    user: EmployeeUserDto,
  ): Promise<void> {
    const visa = await this.database.canadaVisa.findUnique({
      where: { id: editCanadaVisaDto.id },
      include: {
        application: true,
      },
    });

    if (!visa)
      throw new NotFoundException(
        `Visa with ID ${editCanadaVisaDto.id} not found.`,
      );

    await this.checkApplicationStatus(visa.application.id);

    const changes: string[] = [];

    if (
      editCanadaVisaDto.visaApplicationAndBiometricFee &&
      visa.visaApplicationAndBiometricFee !==
        editCanadaVisaDto.visaApplicationAndBiometricFee
    ) {
      changes.push(
        `Visa application and biometric fee status updated from ${visa.visaApplicationAndBiometricFee} to ${editCanadaVisaDto.visaApplicationAndBiometricFee}`,
      );
    }

    if (
      visa.visaApplicationStatus ==
      CanadaVisaApplicationStatus.DocumentsReceived
    ) {
      await this.database.$transaction(async () => {
        const updatedVisa = await this.database.canadaVisa.update({
          where: { id: editCanadaVisaDto.id },
          data: {
            visaApplicationStatus:
              editCanadaVisaDto.visaApplicationAndBiometricFee ==
              VisaPaymentStatus.Paid
                ? CanadaVisaApplicationStatus.VisaApplicationAndBiometricFeePaid
                : visa.visaApplicationStatus,
            visaApplicationAndBiometricFee:
              editCanadaVisaDto.visaApplicationAndBiometricFee,
            updatedAt: new Date(Date.now()),
          },
        });

        await this.database.canadaVisa.update({
          where: { id: editCanadaVisaDto.id },
          data: {
            visaApplicationStatus:
              updatedVisa.visaApplicationAndBiometricFeeAmount
                ? CanadaVisaApplicationStatus.VisaApplicationAndBiometricFeePaid
                : updatedVisa.visaApplicationStatus,
            updatedAt: new Date(Date.now()),
          },
        });

        await this.auditService.createAudit({
          entity: 'Canada Visa',
          operation: Operation.Update,
          recordId: visa.application.id,
          userId: user.id,
          previousValues: JSON.stringify(
            plainToInstance(CanadaVisaDto, visa, {
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

  async editBiometricSubmissionDate(
    editCanadaVisaDto: EditCanadaVisaDto,
    user: EmployeeUserDto,
  ): Promise<void> {
    try {
      const visa = await this.database.canadaVisa.findUnique({
        where: { id: editCanadaVisaDto.id },
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
          `Visa with ID ${editCanadaVisaDto.id} not found.`,
        );

      await this.checkApplicationStatus(visa.application.id);

      if (
        visa.visaApplicationStatus ==
          CanadaVisaApplicationStatus.VisaApplicationAndBiometricFeePaid ||
        visa.visaApplicationStatus ==
          CanadaVisaApplicationStatus.DepositPaymentPending
      ) {
        await this.database.$transaction(async () => {
          const changes: string[] = [];

          if (
            editCanadaVisaDto.biometricSubmissionDate &&
            visa.biometricSubmissionDate !==
              editCanadaVisaDto.biometricSubmissionDate
          ) {
            changes.push(
              `Biometric submission date updated from ${visa.biometricSubmissionDate} -> ${editCanadaVisaDto.biometricSubmissionDate}`,
            );
          }

          let serviceFeeDepositDate: Date;
          if (editCanadaVisaDto.biometricSubmissionDate)
            // 21 days after biometric submission date
            serviceFeeDepositDate = new Date(
              editCanadaVisaDto.biometricSubmissionDate.getTime() +
                21 * 24 * 60 * 60 * 1000,
            );

          const updatedVisa = await this.database.canadaVisa.update({
            where: { id: editCanadaVisaDto.id },
            data: {
              visaApplicationStatus:
                CanadaVisaApplicationStatus.DepositPaymentPending,
              biometricSubmissionDate:
                editCanadaVisaDto.biometricSubmissionDate,
              visaApplicationAndBiometricSubmitted:
                editCanadaVisaDto.visaApplicationAndBiometricSubmitted,
              serviceFeeDepositDate: serviceFeeDepositDate,
              updatedAt: new Date(Date.now()),
            },
          });

          await this.auditService.createAudit({
            entity: 'Canada Visa',
            operation: Operation.Update,
            recordId: visa.application.id,
            userId: user.id,
            previousValues: JSON.stringify(
              plainToInstance(CanadaVisaDto, visa, {
                excludeExtraneousValues: true,
              }),
            ),
            detail: changes.join(`\n`),
          });

          if (
            visa.biometricSubmissionDate !==
            editCanadaVisaDto.biometricSubmissionDate
          ) {
            const createNotificationDto = new CreateNotificationDto();
            createNotificationDto.title = `Visa Application`;
            createNotificationDto.content = `Your biometric submission date has been updated.`;
            createNotificationDto.recipientId =
              visa.application.student.user.id;

            await this.notificationService.sendNotification(
              createNotificationDto,
            );
          }

          if (
            visa.biometricSubmissionDate &&
            visa.biometricSubmissionDate !==
              editCanadaVisaDto.biometricSubmissionDate
          ) {
            const editCalendarDto = new EditCalendarDto();
            editCalendarDto.externalId = `Biometric-Submission-Date-${visa.application.id}`;
            editCalendarDto.startDate = updatedVisa.biometricSubmissionDate;
            editCalendarDto.endDate = updatedVisa.biometricSubmissionDate;
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
              updatedVisa.visaApplicationAndBiometricSubmitted ==
              VisaApplicationAndBiometricFeeStatus.Attended
            )
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
              updatedVisa.biometricSubmissionDate,
            );
            createInterviewCalendarDto.endDate = new Date(
              updatedVisa.biometricSubmissionDate,
            );
            createInterviewCalendarDto.externalId = `Biometric-Submission-Date-${visa.application.id}`;
            createInterviewCalendarDto.title = `Biometric Submission Date (${student.firstName} ${student.lastName})`;
            createInterviewCalendarDto.description = `Application Country: ${application.country}\nField of Study: ${application.fieldOfStudy} \nEducational Level: ${application.educationalLevel}`;
            createInterviewCalendarDto.eventCategory = EventCategory.Visa;
            createInterviewCalendarDto.color =
              CalendarColor.BiometricSubmission;
            createInterviewCalendarDto.applicationId = visa.application.id;
            createInterviewCalendarDto.employeeId = visa.application.visaId;
            createInterviewCalendarDto.googleColor =
              CalendarColor.BiometricSubmissionGoogle;

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
              CalendarColor.CanadaServiceFee;
            createServiceFeeDepositDateCalendarDto.applicationId =
              visa.application.id;
            createServiceFeeDepositDateCalendarDto.employeeId =
              visa.application.visaId;
            createServiceFeeDepositDateCalendarDto.googleColor =
              CalendarColor.CanadaServiceFeeGoogle;

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

  async editServiceFeeDepositPaymentStatus(
    editCanadaVisaDto: EditCanadaVisaDto,
    user: EmployeeUserDto,
  ): Promise<void> {
    try {
      const visa = await this.database.canadaVisa.findUnique({
        where: { id: editCanadaVisaDto.id },
        include: { application: true },
      });

      if (!visa)
        throw new NotFoundException(
          `Visa with ID ${editCanadaVisaDto.id} not found.`,
        );

      await this.checkApplicationStatus(visa.application.id);

      if (
        visa.visaApplicationStatus ==
        CanadaVisaApplicationStatus.DepositPaymentPending
      ) {
        const updatedVisa = await this.database.canadaVisa.update({
          where: { id: editCanadaVisaDto.id },
          data: {
            serviceFeeDepositPaymentStatus:
              editCanadaVisaDto.serviceFeeDepositPaymentStatus,
            visaApplicationStatus:
              editCanadaVisaDto.serviceFeeDepositPaymentStatus ===
              DepositPaymentStatus.Paid
                ? CanadaVisaApplicationStatus.DepositPaymentComplete
                : visa.visaApplicationStatus,
            updatedAt: new Date(Date.now()),
          },
        });

        if (
          (visa.serviceFeeDepositDate &&
            visa.serviceFeeDepositDate !== updatedVisa.serviceFeeDepositDate) ||
          updatedVisa.serviceFeeDepositPaymentStatus ==
            DepositPaymentStatus.Paid
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
          ) {
            editCalendarDto.isAttended = true;

            const user = plainToInstance(UserDto, visaUser, {
              excludeExtraneousValues: true,
            });

            await this.calendarService.editCalendar(editCalendarDto, user);
          }
        }

        await this.auditService.createAudit({
          entity: 'Canada Visa',
          operation: Operation.Update,
          recordId: visa.application.id,
          userId: user.id,
          previousValues: JSON.stringify(
            plainToInstance(CanadaVisaDto, visa, {
              excludeExtraneousValues: true,
            }),
          ),
          detail: `Service fee deposit payment status updated from ${visa.serviceFeeDepositPaymentStatus ? 'Paid' : 'Pending'} -> ${editCanadaVisaDto.serviceFeeDepositPaymentStatus ? 'Paid' : 'Pending'}`,
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

  async editVisaConfirmationFiles(
    id: string,
    paymentConfirmationFileUri: string,
    applicationConfirmationFileUri: string,
    user: EmployeeUserDto,
  ): Promise<void> {
    const visa = await this.database.canadaVisa.findUnique({
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

    if (!visa) throw new NotFoundException(`Visa with ID ${id} not found.`);

    await this.checkApplicationStatus(visa.application.id);

    if (visa.applicationConfirmationFileUri)
      await this.fileService.deleteFileAsync(
        visa.applicationConfirmationFileUri,
      );

    if (visa.paymentConfirmationFileUri)
      await this.fileService.deleteFileAsync(visa.paymentConfirmationFileUri);

    if (
      visa.visaApplicationStatus ==
      CanadaVisaApplicationStatus.DepositPaymentComplete
    ) {
      if (paymentConfirmationFileUri && applicationConfirmationFileUri) {
        const notificationDto = new CreateNotificationDto();
        notificationDto.title = 'Confirmation Received';
        notificationDto.content =
          'Your payment and application confirmation files are ready!';
        notificationDto.recipientId = visa.application.student.user.id;

        await this.notificationService.sendNotification(notificationDto);
      }

      const changes: string[] = [];

      if (
        paymentConfirmationFileUri &&
        visa.paymentConfirmationFileUri !== paymentConfirmationFileUri
      ) {
        changes.push(`Payment confirmation file updated`);
      }

      if (
        applicationConfirmationFileUri &&
        visa.applicationConfirmationFileUri !== applicationConfirmationFileUri
      ) {
        changes.push(`Application confirmation file updated`);
      }

      await this.database.canadaVisa.update({
        where: { id: id },
        data: {
          paymentConfirmationFileUri: paymentConfirmationFileUri,
          applicationConfirmationFileUri: applicationConfirmationFileUri,
          visaApplicationStatus: CanadaVisaApplicationStatus.ConfirmationSent,
          confirmationSent: true,
          updatedAt: new Date(Date.now()),
        },
      });

      await this.auditService.createAudit({
        entity: 'Canada Visa',
        operation: Operation.Update,
        recordId: visa.application.id,
        userId: user.id,
        previousValues: JSON.stringify(
          plainToInstance(CanadaVisaDto, visa, {
            excludeExtraneousValues: true,
          }),
        ),
        detail: changes.join(`\n`),
      });

      if (changes.length > 0) {
        const createNotificationDto = new CreateNotificationDto();
        createNotificationDto.title = `Visa Application`;
        createNotificationDto.content = `Your payment and confirmation files are ready or updated. Contact your agent for more info.`;
        createNotificationDto.recipientId = visa.application.student.user.id;

        await this.notificationService.sendNotification(createNotificationDto);
      }
    } else {
      throw new BadRequestException(
        `Visa status in: ${visa.visaApplicationStatus}`,
      );
    }
  }

  async editConfirmationReceivedStatus(
    userId: string,
    editCanadaVisaDto: EditCanadaVisaDto,
  ): Promise<void> {
    const visa = await this.database.canadaVisa.findUnique({
      where: {
        id: editCanadaVisaDto.id,
        application: {
          student: {
            user: {
              id: userId,
            },
          },
        },
      },
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
        `Visa with ID ${editCanadaVisaDto.id} not found.`,
      );

    await this.checkApplicationStatus(visa.application.id);

    if (
      visa.visaApplicationStatus == CanadaVisaApplicationStatus.ConfirmationSent
    ) {
      const updatedVisa = await this.database.canadaVisa.update({
        where: { id: editCanadaVisaDto.id },
        data: {
          confirmationReceived: editCanadaVisaDto.confirmationReceived,
          updatedAt: new Date(Date.now()),
        },
      });

      if (updatedVisa.confirmationReceived)
        await this.database.application.update({
          where: { id: visa.applicationId },
          data: {
            applicationStatus: ApplicationStatus.VisaDecision,
            updatedAt: new Date(Date.now()),
          },
        });

      await this.auditService.createAudit({
        entity: 'Canada Visa',
        operation: Operation.Update,
        recordId: visa.application.id,
        userId: visa.application.student.user.id,
        previousValues: JSON.stringify(
          plainToInstance(CanadaVisaDto, visa, {
            excludeExtraneousValues: true,
          }),
        ),
        detail: `Confirmation received status updated from ${visa.confirmationReceived} to ${editCanadaVisaDto.confirmationReceived}`,
      });
    } else {
      throw new BadRequestException(
        `Visa status in: ${visa.visaApplicationStatus}`,
      );
    }
  }

  async editVisaStatus(
    editCanadaVisaDto: EditCanadaVisaDto,
    user: EmployeeUserDto,
  ): Promise<void> {
    const visa = await this.database.canadaVisa.findUnique({
      where: { id: editCanadaVisaDto.id },
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
        `Visa with ID ${editCanadaVisaDto.id} not found.`,
      );

    if (visa.application.applicationStatus !== ApplicationStatus.VisaDecision) {
      throw new BadRequestException(
        `Application is in ${visa.application?.applicationStatus} status.`,
      );
    }

    if (
      visa.visaApplicationStatus == CanadaVisaApplicationStatus.ConfirmationSent
    ) {
      const notificationDto = new CreateNotificationDto();
      if (editCanadaVisaDto.visaAccepted) {
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

      await this.database.canadaVisa.update({
        where: { id: editCanadaVisaDto.id },
        data: {
          visaAccepted: editCanadaVisaDto.visaAccepted,
          visaStatusNotificationSent:
            editCanadaVisaDto.visaStatusNotificationSent,
          visaStatusNotificationSentAt: new Date(Date.now()),
          visaApplicationStatus: CanadaVisaApplicationStatus.NotifiedUser,
          updatedAt: new Date(Date.now()),
        },
      });

      if (visa.visaAccepted !== editCanadaVisaDto.visaAccepted)
        await this.auditService.createAudit({
          entity: 'Canada Visa',
          operation: Operation.Update,
          recordId: visa.application.id,
          userId: user.id,
          previousValues: JSON.stringify(
            plainToInstance(CanadaVisaDto, visa, {
              excludeExtraneousValues: true,
            }),
          ),
          detail: `Visa status updated from ${visa.visaAccepted ? 'Accepted' : 'Rejected'} to ${editCanadaVisaDto.visaAccepted ? 'Accepted' : 'Rejected'}`,
        });
    } else {
      throw new BadRequestException(
        `Visa status in: ${visa.visaApplicationStatus}`,
      );
    }
  }
}
