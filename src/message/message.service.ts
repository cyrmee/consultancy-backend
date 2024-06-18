import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateForumMessageDto, CreateMessageDto, MessageDto } from './dto';
import { plainToInstance } from 'class-transformer';
import { CryptoService } from '../common/crypto.service';

@Injectable()
export class MessageService {
  constructor(
    private readonly database: PrismaService,
    private readonly cryptoService: CryptoService,
  ) {}

  async getMessageById(userId: string, messageId: string): Promise<MessageDto> {
    try {
      const message = await this.database.message.findUnique({
        where: {
          id: messageId,
          OR: [
            {
              recipientId: userId,
            },
            {
              senderId: userId,
            },
          ],
        },
      });

      if (!message)
        throw new BadRequestException(`Message with ID ${messageId} not found`);

      return plainToInstance(MessageDto, message, {
        excludeExtraneousValues: true,
      });
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async createMessage(createMessageDto: CreateMessageDto): Promise<void> {
    try {
      const existingConversation = await this.database.conversation.findFirst({
        where: {
          AND: [
            { participants: { some: { id: createMessageDto.senderId } } },
            { participants: { some: { id: createMessageDto.recipientId } } },
          ],
        },
      });

      await this.database.$transaction(async () => {
        let conversationId: string;

        if (existingConversation) conversationId = existingConversation.id;
        else {
          const newConversation = await this.database.conversation.create({
            data: {
              participants: {
                connect: [
                  { id: createMessageDto.senderId },
                  { id: createMessageDto.recipientId },
                ],
              },
            },
          });
          conversationId = newConversation.id;
        }

        await this.database.message.create({
          data: {
            content: createMessageDto.content,
            sender: {
              connect: {
                id: createMessageDto.senderId,
              },
            },
            recipient: {
              connect: {
                id: createMessageDto.recipientId,
              },
            },
            conversation: {
              connect: { id: conversationId },
            },
          },
        });

        await this.database.conversation.update({
          where: { id: conversationId },
          data: {
            updatedAt: new Date(Date.now()),
          },
        });
      });
    } catch (error) {
      console.error(error);
      if (error.code === 'P2002')
        throw new BadRequestException(`${error.meta.target} already exists`);
      else if (error.code === 'P2025')
        throw new BadRequestException(`${error.meta.cause}`);
      else if (error.code === 'P2003')
        throw new BadRequestException(`Referring to non existent user...`);
      throw error;
    }
  }

  async createForumMessage(
    createForumMessageDto: CreateForumMessageDto,
  ): Promise<void> {
    try {
      const forum = await this.database.conversation.findFirst({
        where: {
          id: createForumMessageDto.forumId,
        },
      });

      if (!forum) return;

      await this.database.$transaction(async () => {
        await this.database.forumMessage.create({
          data: {
            content: createForumMessageDto.content,
            sender: {
              connect: {
                id: createForumMessageDto.senderId,
              },
            },
            conversation: {
              connect: { id: createForumMessageDto.forumId },
            },
          },
        });
      });
    } catch (error) {
      console.error(error);
      if (error.code === 'P2002')
        throw new BadRequestException(`${error.meta.target} already exists`);
      else if (error.code === 'P2025')
        throw new BadRequestException(`${error.meta.cause}`);
      else if (error.code === 'P2003')
        throw new BadRequestException(`Referring to non existent user...`);
      throw error;
    }
  }
}
