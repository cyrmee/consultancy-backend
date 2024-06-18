import {
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { plainToInstance } from 'class-transformer';
import {
  ConversationDto,
  ForumConversationDto,
  ConversationWithoutMessagesDto,
  ForumWithoutMessagesDto,
  UserDto,
} from './dto';
import { CryptoService } from '../common/crypto.service';
import { ConversationType, Role } from '@prisma/client';

@Injectable()
export class ConversationService {
  constructor(
    private readonly database: PrismaService,
    private readonly cryptoService: CryptoService,
  ) {}

  async getConversations(
    userId: string,
  ): Promise<ConversationWithoutMessagesDto[]> {
    try {
      const conversations = await this.database.conversation.findMany({
        where: {
          participants: {
            some: {
              id: userId,
            },
          },
          type: ConversationType.Private,
        },
        include: {
          participants: {
            where: { id: { not: userId } },
          },
          messages: {
            orderBy: { sentAt: 'desc' },
            take: 1,
          },
          _count: {
            select: {
              messages: {
                where: { read: false, senderId: { not: userId } },
              },
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
      });

      const filteredConversations = conversations.filter(
        (conversation) => conversation.participants.length > 0,
      );

      const conversationDtos = plainToInstance(
        ConversationWithoutMessagesDto,
        filteredConversations,
        {
          excludeExtraneousValues: true,
        },
      );

      return conversationDtos;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async getForums(userId: string): Promise<ForumWithoutMessagesDto[]> {
    try {
      const forums = await this.database.conversation.findMany({
        where: {
          participants: {
            some: {
              id: userId,
            },
          },
          type: ConversationType.Forum,
        },
        orderBy: { updatedAt: 'desc' },
        include: {
          messages: {
            orderBy: { sentAt: 'desc' },
            take: 1,
          },
          participants: {
            where: { id: { not: userId } },
          },
          _count: {
            select: {
              forumMessage: {
                where: { read: false, senderId: { not: userId } },
              },
            },
          },
        },
      });

      const filteredForums = forums.filter(
        (conversation) => conversation.participants.length > 0,
      );

      const forumDtos = plainToInstance(
        ForumWithoutMessagesDto,
        filteredForums,
        {
          excludeExtraneousValues: true,
        },
      );

      return forumDtos;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async getConversationById(
    id: string,
    userId: string,
  ): Promise<ConversationDto> {
    try {
      const conversation = await this.database.conversation.findUnique({
        where: {
          id: id,
          type: ConversationType.Private,
          participants: {
            some: { id: userId },
          },
        },
        include: {
          messages: {
            orderBy: { sentAt: 'asc' },
          },
          participants: {
            where: { id: { not: userId } },
          },
        },
      });

      if (!conversation) return;

      await this.database.message.updateMany({
        where: {
          conversationId: id,
          read: false,
          recipientId: userId,
        },
        data: { read: true },
      });

      return plainToInstance(ConversationDto, conversation, {
        excludeExtraneousValues: true,
      });
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async getForumById(
    id: string,
    userId: string,
  ): Promise<ForumConversationDto> {
    try {
      const conversation = await this.database.conversation.findUnique({
        where: { id: id, type: ConversationType.Forum },
        include: {
          forumMessage: {
            orderBy: { sentAt: 'asc' },
            include: {
              sender: true,
            },
          },
          participants: {
            where: { id: { not: userId } },
          },
        },
      });

      if (!conversation) return;

      await this.database.forumMessage.updateMany({
        where: {
          conversationId: id,
          read: false,
        },
        data: { read: true },
      });

      return plainToInstance(ForumConversationDto, conversation, {
        excludeExtraneousValues: true,
      });
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async getEmployeesForChat(userId: string): Promise<UserDto[]> {
    try {
      const employees = await this.database.user.findMany({
        where: {
          id: {
            not: userId,
          },
          conversations: {
            none: {
              participants: {
                some: { id: userId },
              },
            },
          },
          NOT: { roles: { has: Role.Student } },
        },
      });

      return plainToInstance(UserDto, employees, {
        excludeExtraneousValues: true,
      });
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async createEmployeeConversation(
    recipientId: string,
    senderId: string,
  ): Promise<void> {
    try {
      const recipient = await this.database.user.findUnique({
        where: { id: recipientId },
      });

      if (!recipient)
        throw new NotFoundException(
          `Recipient with ID ${recipientId} not found`,
        );

      const conversation = await this.database.conversation.findFirst({
        where: {
          AND: [
            {
              participants: {
                some: {
                  id: recipientId,
                },
              },
            },
            {
              participants: {
                some: {
                  id: senderId,
                },
              },
            },
          ],
          type: ConversationType.Private,
        },
      });

      if (conversation)
        throw new HttpException(
          'Conversation already exists',
          HttpStatus.ACCEPTED,
        );

      await this.database.conversation.create({
        data: {
          participants: {
            connect: [{ id: recipientId }, { id: senderId }],
          },
          type: ConversationType.Private,
        },
      });
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
}
