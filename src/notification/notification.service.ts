import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateNotificationDto,
  CreateUserNotificationDto,
  NotificationDto,
} from './dto';
import { plainToInstance } from 'class-transformer';
import Expo from 'expo-server-sdk';
import { NotificationType, Role } from '@prisma/client';
import { EmployeeUserDto, StudentUserDto } from '../auth/dto';

@Injectable()
export class NotificationService {
  constructor(private readonly database: PrismaService) {}

  async getNotifications(user: EmployeeUserDto): Promise<NotificationDto[]> {
    try {
      const notifications = await this.database.notification.findMany({
        where: {
          senderId: user.id,
        },
        include: {
          recipient: true,
          sender: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      return plainToInstance(NotificationDto, notifications, {
        excludeExtraneousValues: true,
      });
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async getNewNotificationCountForStudent(
    user: StudentUserDto,
  ): Promise<number> {
    try {
      const recipient = await this.database.user.findUnique({
        where: { id: user.id },
      });

      if (!recipient)
        throw new NotFoundException(`User with ID ${recipient.id} not found.`);

      const notificationsCount = await this.database.notification.count({
        where: {
          recipientId: recipient.id,
          type: NotificationType.Normal,
          read: false,
        },
      });

      return notificationsCount;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async getNotificationsForStudent(
    user: StudentUserDto,
  ): Promise<NotificationDto[]> {
    try {
      const recipient = await this.database.user.findUnique({
        where: { id: user.id },
      });

      if (!recipient)
        throw new NotFoundException(`User with ID ${recipient.id} not found.`);

      const notifications = await this.database.notification.findMany({
        where: {
          recipientId: recipient.id,
          type: NotificationType.Normal,
        },
        include: {
          recipient: true,
          sender: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      await this.database.notification.updateMany({
        where: {
          recipientId: user.id,
          read: false,
        },
        data: {
          read: true,
        },
      });

      return plainToInstance(NotificationDto, notifications, {
        excludeExtraneousValues: true,
      });
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async getNewNotificationCountForEmployee(
    user: EmployeeUserDto,
  ): Promise<number> {
    try {
      const recipient = await this.database.user.findUnique({
        where: { id: user.id },
      });

      if (!recipient)
        throw new NotFoundException(`User with ID ${recipient.id} not found.`);

      const notificationsCount = await this.database.notification.count({
        where: {
          recipientId: recipient.id,
          type: NotificationType.Normal,
          read: false,
        },
      });

      return notificationsCount;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async getNotificationsForEmployee(
    user: EmployeeUserDto,
  ): Promise<NotificationDto[]> {
    try {
      const recipient = await this.database.user.findUnique({
        where: { id: user.id },
      });

      if (!recipient)
        throw new NotFoundException(`User with ID ${recipient.id} not found.`);

      const notifications = await this.database.notification.findMany({
        where: {
          recipientId: recipient.id,
          type: NotificationType.Normal,
        },
        include: {
          recipient: true,
          sender: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      await this.database.notification.updateMany({
        where: {
          recipientId: user.id,
          read: false,
        },
        data: {
          read: true,
        },
      });

      return plainToInstance(NotificationDto, notifications, {
        excludeExtraneousValues: true,
      });
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async addUserTokenToDatabase(
    createUserNotificationDto: CreateUserNotificationDto,
  ): Promise<void> {
    try {
      const user = await this.database.user.findUnique({
        where: { id: createUserNotificationDto.userId },
      });

      if (!user)
        throw new NotFoundException(
          `User with ID ${createUserNotificationDto.userId} not found.`,
        );

      if (!user.roles.includes(Role.Student))
        throw new BadRequestException(`User is not a student`);

      await this.database.userNotification.create({
        data: {
          expoToken: createUserNotificationDto.expoToken,
          user: {
            connect: {
              id: createUserNotificationDto.userId,
            },
          },
        },
      });
    } catch (error) {
      console.error(error);
      if (error.code === 'P2002')
        throw new BadRequestException(
          `User with this Expo token already exists.`,
        );
      else if (error.code === 'P2025')
        throw new BadRequestException(
          `Resource not found: ${error.meta.cause}`,
        );
      throw error;
    }
  }

  async sendNotification(createNotificationDto: CreateNotificationDto) {
    try {
      if (createNotificationDto.senderId)
        await this.database.notification.create({
          data: {
            title: createNotificationDto.title,
            content: createNotificationDto.content,
            type: createNotificationDto.type
              ? createNotificationDto.type
              : NotificationType.Normal,
            recipient: {
              connect: {
                id: createNotificationDto.recipientId,
              },
            },
            sender: {
              connect: {
                id: createNotificationDto.senderId,
              },
            },
          },
        });
      else
        await this.database.notification.create({
          data: {
            title: createNotificationDto.title,
            content: createNotificationDto.content,
            type: createNotificationDto.type
              ? createNotificationDto.type
              : NotificationType.Normal,
            recipient: {
              connect: {
                id: createNotificationDto.recipientId,
              },
            },
          },
        });

      const userDevices = await this.database.userNotification.findMany({
        where: { userId: createNotificationDto.recipientId },
        include: { user: true },
      });

      if (userDevices.length > 0) {
        const expo = new Expo();
        const messages = [];
        if (!userDevices[0].user.roles.includes(Role.Student))
          throw new BadRequestException(`User is not a student`);

        userDevices.forEach((userDevice) => {
          messages.push({
            to: userDevice.expoToken,
            title: createNotificationDto.title,
            body: createNotificationDto.content,
            sound: 'default',
            channelId: 'default',
            // TODO: insert a link to your icon
            icon: '',
          });
        });

        await expo.sendPushNotificationsAsync(messages);
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

  async revokeNotificationAccess(userId: string): Promise<void> {
    try {
      await this.database.userNotification.deleteMany({
        where: { userId: userId },
      });
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
}
