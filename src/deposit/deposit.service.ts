import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { PrismaService } from '../prisma/prisma.service';
import { DepositDto, EditDepositDto } from './dto';
import {
  ApplicationStatus,
  Operation,
  PaymentStatus,
  Role,
} from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { EmployeeUserDto } from '../auth/dto';
import { CalendarService } from '../calendar/calendar.service';
import { EditCalendarDto } from '../calendar/dto';
import { UserDto } from '../user/dto';
import { CreateNotificationDto } from '../notification/dto';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class DepositService {
  constructor(
    private readonly database: PrismaService,
    private readonly auditService: AuditService,
    private readonly calendarService: CalendarService,
    private readonly notificationService: NotificationService,
  ) {}

  async getDeposit(applicationId: string): Promise<DepositDto> {
    try {
      const deposit = await this.database.deposit.findUnique({
        where: { applicationId: applicationId },
        include: {
          application: true,
        },
      });

      if (!deposit)
        throw new NotFoundException(
          `Deposit for application ID ${applicationId} not found.`,
        );

      if (deposit.expiration <= new Date(Date.now()))
        await this.database.deposit.update({
          where: { applicationId: applicationId },
          data: {
            status: PaymentStatus.Expired,
            updatedAt: new Date(Date.now()),
          },
        });

      return plainToInstance(DepositDto, deposit, {
        excludeExtraneousValues: true,
      });
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async getDepositForLoggedInStudent(
    userId: string,
    applicationId: string,
  ): Promise<DepositDto> {
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
          `Can't access applications that are not yours.`,
        );

      const deposit = await this.database.deposit.findUnique({
        where: { applicationId: applicationId },
      });

      if (!deposit)
        throw new NotFoundException(
          `Deposit for application ID ${applicationId} not found.`,
        );

      if (deposit.expiration <= new Date(Date.now()))
        await this.database.deposit.update({
          where: { applicationId: applicationId },
          data: {
            status: PaymentStatus.Expired,
            updatedAt: new Date(Date.now()),
          },
        });

      return plainToInstance(DepositDto, deposit, {
        excludeExtraneousValues: true,
      });
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async editDeposit(
    editDepositDto: EditDepositDto,
    user: EmployeeUserDto,
  ): Promise<void> {
    try {
      const deposit = await this.database.deposit.findUnique({
        where: {
          applicationId: editDepositDto.applicationId,
        },
        include: {
          application: {
            include: {
              student: true,
              admission: {
                include: {
                  user: true,
                },
              },
            },
          },
        },
      });

      if (!deposit)
        throw new NotFoundException(
          `deposit for application ID ${editDepositDto.applicationId} not found.`,
        );

      if (deposit.application.applicationStatus != ApplicationStatus.Deposit)
        throw new NotFoundException(
          `Application is in ${deposit.application.applicationStatus} status.`,
        );

      await this.database.$transaction(async () => {
        const updatedDeposit = await this.database.deposit.update({
          where: {
            applicationId: editDepositDto.applicationId,
          },
          data: {
            status:
              editDepositDto.isDeposited && editDepositDto.isBlocked
                ? PaymentStatus.Complete
                : editDepositDto.expiration <= new Date(Date.now())
                  ? PaymentStatus.Expired
                  : PaymentStatus.Pending,
            isDeposited: editDepositDto.isDeposited,
            isBlocked: editDepositDto.isBlocked,
            expiration: editDepositDto.expiration,
            updatedAt: new Date(Date.now()),
          },
          include: {
            application: true,
          },
        });

        if (updatedDeposit.isDeposited && updatedDeposit.isBlocked) {
          await this.database.application.update({
            where: { id: editDepositDto.applicationId },
            data: {
              applicationStatus: ApplicationStatus.EnglishTest,
            },
          });

          const createNotificationDto = new CreateNotificationDto();
          createNotificationDto.title = `Application Update`;
          createNotificationDto.content = `Student ${deposit.application.student.firstName} ${deposit.application.student.lastName} is in admission status.`;
          createNotificationDto.recipientId =
            deposit.application.admission.userId;

          await this.notificationService.sendNotification(
            createNotificationDto,
          );
        }

        if (updatedDeposit.isBlocked !== deposit.isBlocked) {
          if (updatedDeposit.isBlocked) {
            await this.auditService.createAudit({
              entity: 'Deposit',
              operation: Operation.Update,
              recordId: updatedDeposit.application.id,
              userId: user.id,
              previousValues: JSON.stringify(
                plainToInstance(DepositDto, updatedDeposit, {
                  excludeExtraneousValues: true,
                }),
              ),
              detail: 'Account Blocked',
            });
          } else {
            await this.auditService.createAudit({
              entity: 'Deposit',
              operation: Operation.Update,
              recordId: updatedDeposit.application.id,
              userId: user.id,
              previousValues: JSON.stringify(
                plainToInstance(DepositDto, updatedDeposit, {
                  excludeExtraneousValues: true,
                }),
              ),
              detail: 'Account Unblocked',
            });
          }
        }

        if (updatedDeposit.isDeposited !== deposit.isDeposited) {
          if (updatedDeposit.isDeposited)
            await this.auditService.createAudit({
              entity: 'Deposit',
              operation: Operation.Update,
              recordId: updatedDeposit.application.id,
              userId: user.id,
              previousValues: JSON.stringify(
                plainToInstance(DepositDto, updatedDeposit, {
                  excludeExtraneousValues: true,
                }),
              ),
              detail: 'Deposit Successful',
            });
          else {
            await this.auditService.createAudit({
              entity: 'Deposit',
              operation: Operation.Update,
              recordId: updatedDeposit.application.id,
              userId: user.id,
              previousValues: JSON.stringify(
                plainToInstance(DepositDto, updatedDeposit, {
                  excludeExtraneousValues: true,
                }),
              ),
              detail: 'Deposit not Successful',
            });
          }
        }

        const createNotificationDto = new CreateNotificationDto();
        createNotificationDto.title = `Deposit`;
        createNotificationDto.content = `Your deposit status has been updated. View the progress tab for details.`;
        createNotificationDto.recipientId = deposit.application.student.userId;

        await this.notificationService.sendNotification(createNotificationDto);

        const editCalendarDto = new EditCalendarDto();
        editCalendarDto.externalId = `Deposit-${updatedDeposit.application.id}`;
        editCalendarDto.startDate = editDepositDto.expiration;
        editCalendarDto.endDate = editDepositDto.expiration;
        editCalendarDto.applicationId = deposit.application.id;

        const finance = await this.database.employee.findUnique({
          where: { id: deposit.application.financeId },
          include: {
            user: true,
          },
        });

        editCalendarDto.isAttended =
          updatedDeposit.isDeposited && updatedDeposit.isBlocked;

        const financeUser = plainToInstance(UserDto, finance, {
          excludeExtraneousValues: true,
        });

        await this.calendarService.editCalendar(editCalendarDto, financeUser);
      });
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async deleteDeposit(
    applicationId: string,
    user: EmployeeUserDto,
  ): Promise<void> {
    try {
      const deposit = await this.database.deposit.findUnique({
        where: { applicationId: applicationId },
        include: {
          application: true,
        },
      });

      if (deposit.application.applicationStatus != ApplicationStatus.Deposit)
        throw new NotFoundException(
          `Application is in ${deposit.application.applicationStatus} status.`,
        );

      await this.database.$transaction(async () => {
        await this.database.deposit.delete({
          where: { applicationId: applicationId },
        });

        await this.database.calendar.delete({
          where: {
            externalId: `Deposit-${applicationId}`,
          },
        });

        await this.auditService.createAudit({
          entity: 'Deposit',
          operation: Operation.Delete,
          recordId: deposit.application.id,
          userId: user.id,
          previousValues: JSON.stringify(
            plainToInstance(DepositDto, deposit, {
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
}
