import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateEnglishTestDto,
  EditEnglishTestDto,
  EnglishTestDto,
  ApplicationEnglishTestDto,
} from './dto';
import { plainToInstance } from 'class-transformer';
import {
  ApplicationStatus,
  EnglishTestStatus,
  Operation,
  Role,
} from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { EmployeeUserDto } from '../auth/dto';
import { CreateNotificationDto } from '../notification/dto';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class EnglishTestService {
  constructor(
    private readonly database: PrismaService,
    private readonly auditService: AuditService,
    private readonly notificationService: NotificationService,
  ) {}

  async getEnglishTest(
    applicationId: string,
  ): Promise<ApplicationEnglishTestDto> {
    try {
      const application = await this.database.application.findUnique({
        where: { id: applicationId },
        include: { englishTest: true },
      });

      if (!application)
        throw new NotFoundException(
          `Application with ID ${applicationId} not found.`,
        );

      return plainToInstance(ApplicationEnglishTestDto, application, {
        excludeExtraneousValues: true,
      });
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async getEnglishTestForLoggedInStudent(
    userId: string,
    applicationId: string,
  ): Promise<ApplicationEnglishTestDto> {
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

      const application = await this.database.application.findUnique({
        where: { id: applicationId },
        include: { englishTest: true },
      });

      if (!application)
        throw new NotFoundException(
          `Application with ID ${applicationId} not found.`,
        );

      return plainToInstance(ApplicationEnglishTestDto, application, {
        excludeExtraneousValues: true,
      });
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async createEnglishTest(
    createEnglishTestDto: CreateEnglishTestDto,
    user: EmployeeUserDto,
  ): Promise<void> {
    try {
      const application = await this.database.application.findUnique({
        where: {
          id: createEnglishTestDto.applicationId,
        },
        include: {
          student: {
            include: {
              user: true,
            },
          },
          englishTest: true,
        },
      });

      if (!application) {
        throw new NotFoundException(
          `Application with ID ${createEnglishTestDto.applicationId} not found.`,
        );
      }

      if (application.englishTest) {
        throw new BadRequestException(
          `English test already exists for application with ID ${createEnglishTestDto.applicationId}.`,
        );
      }

      if (application.applicationStatus !== ApplicationStatus.EnglishTest)
        throw new BadRequestException(
          `Application in ${application.applicationStatus} status.`,
        );

      await this.database.englishTest.create({
        data: {
          practiceLink: createEnglishTestDto.practiceLink,
          practiceLink2: createEnglishTestDto.practiceLink2,
          testDate: createEnglishTestDto.testDate,
          email: createEnglishTestDto.email,
          password: createEnglishTestDto.password,
          application: { connect: { id: createEnglishTestDto.applicationId } },
        },
      });

      await this.auditService.createAudit({
        entity: 'English Test',
        operation: Operation.Create,
        recordId: createEnglishTestDto.applicationId,
        userId: user.id,
        previousValues: null,
      });

      const createNotificationDto = new CreateNotificationDto();
      createNotificationDto.title = 'English Test';
      createNotificationDto.content =
        'Your english test details are available.';
      createNotificationDto.recipientId = application.student.user.id;
      createNotificationDto.senderId = null;

      await this.notificationService.sendNotification(createNotificationDto);
    } catch (error) {
      console.error(error);
      if (error.code === 'P2002')
        throw new BadRequestException(`${error.meta.target} already exists`);
      else if (error.code === 'P2025')
        throw new BadRequestException(`${error.meta.cause}`);
      throw error;
    }
  }

  async editEnglishTest(
    editEnglishTestDto: EditEnglishTestDto,
    user: EmployeeUserDto,
  ): Promise<void> {
    try {
      const englishTest = await this.database.englishTest.findUnique({
        where: {
          applicationId: editEnglishTestDto.applicationId,
        },
        include: {
          application: {
            include: {
              student: {
                include: {
                  agent: true,
                  user: true,
                },
              },
            },
          },
        },
      });

      if (!englishTest) {
        throw new NotFoundException(
          `English test for application ID ${editEnglishTestDto.applicationId} not found.`,
        );
      }

      if (
        englishTest.application.applicationStatus !==
        ApplicationStatus.EnglishTest
      )
        throw new BadRequestException(
          `Application in ${englishTest.application.applicationStatus} status.`,
        );

      const changes: string[] = [];

      if (
        editEnglishTestDto.practiceLink &&
        englishTest.practiceLink !== editEnglishTestDto.practiceLink
      ) {
        changes.push(
          `Practice link has been updated from ${englishTest.practiceLink} -> ${editEnglishTestDto.practiceLink}`,
        );
      }

      if (
        editEnglishTestDto.practiceLink2 &&
        englishTest.practiceLink2 !== editEnglishTestDto.practiceLink2
      ) {
        changes.push(
          `Practice link 2 has been updated from ${englishTest.practiceLink2} -> ${editEnglishTestDto.practiceLink2}`,
        );
      }

      if (
        editEnglishTestDto.testDate &&
        englishTest.testDate !== editEnglishTestDto.testDate
      ) {
        changes.push(
          `Test date has been updated from ${englishTest.testDate} -> ${editEnglishTestDto.testDate}`,
        );
      }

      if (
        editEnglishTestDto.score &&
        englishTest.score !== editEnglishTestDto.score
      ) {
        changes.push(
          `Score has been updated from ${englishTest.score} -> ${editEnglishTestDto.score}`,
        );
      }

      if (
        editEnglishTestDto.email &&
        englishTest.email !== editEnglishTestDto.email
      ) {
        changes.push(
          `Email has been updated from ${englishTest.email} -> ${editEnglishTestDto.email}`,
        );
      }

      if (
        editEnglishTestDto.password &&
        englishTest.password !== editEnglishTestDto.password
      ) {
        changes.push(`Password has been updated`);
      }

      const updatedEnglishTest = await this.database.englishTest.update({
        where: { applicationId: editEnglishTestDto.applicationId },
        data: {
          practiceLink: editEnglishTestDto.practiceLink,
          practiceLink2: editEnglishTestDto.practiceLink2,
          testDate: editEnglishTestDto.testDate,
          score: editEnglishTestDto.score,
          email: editEnglishTestDto.email,
          password: editEnglishTestDto.password,
          hasPassed: editEnglishTestDto.hasPassed,
          updatedAt: new Date(Date.now()),
        },
        include: {
          application: {
            include: {
              student: {
                include: {
                  agent: true,
                  user: true,
                },
              },
            },
          },
        },
      });

      if (updatedEnglishTest.hasPassed == EnglishTestStatus.Passed)
        await this.database.application.update({
          where: { id: updatedEnglishTest.applicationId },
          data: { applicationStatus: ApplicationStatus.Admission },
        });

      await this.auditService.createAudit({
        entity: 'English Test',
        operation: Operation.Update,
        recordId: englishTest.application.id,
        userId: user.id,
        previousValues: JSON.stringify(
          plainToInstance(EnglishTestDto, englishTest, {
            excludeExtraneousValues: true,
          }),
        ),
        detail: changes.join(`\n`),
      });

      if (changes.length > 0) {
        if (editEnglishTestDto.score !== englishTest.score) {
          const createNotificationDto = new CreateNotificationDto();
          createNotificationDto.title = 'English Test';
          createNotificationDto.content = 'Your english test score is updated.';
          createNotificationDto.recipientId =
            englishTest.application.student.user.id;

          await this.notificationService.sendNotification(
            createNotificationDto,
          );
        } else {
          const createNotificationDto = new CreateNotificationDto();
          createNotificationDto.title = 'English Test';
          createNotificationDto.content =
            'Your english test details are updated.';
          createNotificationDto.recipientId =
            englishTest.application.student.user.id;

          await this.notificationService.sendNotification(
            createNotificationDto,
          );
        }
      }
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async deleteEnglishTest(
    applicationId: string,
    user: EmployeeUserDto,
  ): Promise<void> {
    try {
      const englishTest = await this.database.englishTest.findUnique({
        where: {
          applicationId: applicationId,
        },
        include: { application: true },
      });

      if (!englishTest) {
        throw new NotFoundException(
          `English test for application ID ${applicationId} not found.`,
        );
      }

      if (
        englishTest.application.applicationStatus !==
        ApplicationStatus.EnglishTest
      )
        throw new BadRequestException(
          `Application in ${englishTest.application.applicationStatus} status.`,
        );

      await this.database.$transaction(async () => {
        await this.database.englishTest.delete({
          where: { applicationId: applicationId },
        });

        await this.database.application.update({
          where: { id: applicationId },
          data: {
            applicationStatus: ApplicationStatus.Admission,
            updatedAt: new Date(Date.now()),
          },
        });

        await this.auditService.createAudit({
          entity: 'English Test',
          operation: Operation.Delete,
          recordId: englishTest.application.id,
          userId: user.id,
          previousValues: JSON.stringify(
            plainToInstance(EnglishTestDto, englishTest, {
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
