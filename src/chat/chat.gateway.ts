import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { GetUser } from '../auth/decorator';
import { MessageService } from '../message/message.service';
import { Server, Socket } from 'socket.io';
import { CreateForumMessageDto, CreateMessageDto } from '../message/dto';
import { AuthService } from '../auth/auth.service';
import { NotificationType } from '@prisma/client';
import { Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';
import { CreateNotificationDto } from '../notification/dto';
import { UserDto } from '../user/dto';

@WebSocketGateway({
  namespace: 'chat',
  cors: {
    origin: '*',
    allowedHeaders: '*',
    methods: '*',
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(
    private readonly authService: AuthService,
    private readonly messageService: MessageService,
    private readonly database: PrismaService,
    private readonly notificationService: NotificationService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  @WebSocketServer()
  server: Server = new Server();

  // TODO: use cache manager to store user sessions
  userToSessionMap = new Map<string, Set<string>>();

  async handleConnection(client: any) {
    const user = await this.getUserIdFromSocket(client);
    try {
      client.user = user;
      const sessions = this.userToSessionMap.get(user.id) || new Set<string>();
      sessions.add(client.id);
      this.userToSessionMap.set(user.id, sessions);
    } catch (error) {
      console.error('Error handling connection:', error.message);
      client.disconnect();
    }
  }

  async handleDisconnect(client: any) {
    try {
      const user = await this.getUserIdFromSocket(client);
      if (client.id) {
        const sessionId = client.id;
        const sessions = this.userToSessionMap.get(user.id);
        if (sessions) {
          sessions.delete(sessionId);
          if (sessions.size === 0) {
            // If there are no more sessions associated with the user, remove the mapping
            this.userToSessionMap.delete(user.id);
          }
        }
      }
    } catch (error) {
      client.disconnect();
    }
  }

  @SubscribeMessage(`message`)
  async handleMessage(
    @MessageBody() message: CreateMessageDto,
    @GetUser() user: UserDto,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      message.senderId = user.id;

      await this.messageService.createMessage(message);

      const recipientSessions = this.userToSessionMap.get(message.recipientId);
      if (recipientSessions) {
        recipientSessions.forEach((sessionId) => {
          this.server.to(sessionId).emit('message', message);
        });
      }

      const createNotificationDto = new CreateNotificationDto();
      createNotificationDto.title = `${user.firstName} ${user.lastName}`;
      createNotificationDto.content = `${message.content}`;
      createNotificationDto.recipientId = message.recipientId;
      createNotificationDto.type = NotificationType.Chat;

      await this.notificationService.sendNotification(createNotificationDto);

      this.server.to(client.id).emit('message', message);
    } catch (error) {
      console.error('Error handling message:', error.message);
    }
  }

  @SubscribeMessage(`forum-message`)
  async handleForumMessage(
    @MessageBody() forumMessage: CreateForumMessageDto,
    @GetUser() user: UserDto,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      forumMessage.senderId = user.id;

      await this.messageService.createForumMessage(forumMessage);

      const forum = await this.database.conversation.findUnique({
        where: { id: forumMessage.forumId },
        select: {
          title: true,
          participants: {
            select: {
              id: true,
            },
          },
        },
      });

      const recipients = forum.participants.filter(
        (participant) => participant.id !== user.id,
      );

      recipients.forEach(async (recipient) => {
        const recipientSessions = this.userToSessionMap.get(recipient.id);
        if (recipientSessions) {
          recipientSessions.forEach((sessionId) => {
            this.server.to(sessionId).emit('forum-message', forumMessage);
          });
        }

        const createNotificationDto = new CreateNotificationDto();
        createNotificationDto.title = `${user.firstName} ${user.lastName} (Forum: ${forum.title})`;
        createNotificationDto.content = `${forumMessage.content}`;
        createNotificationDto.recipientId = recipient.id;
        createNotificationDto.type = NotificationType.Chat;

        await this.notificationService.sendNotification(createNotificationDto);
      });

      this.server.to(client.id).emit('forum-message', forumMessage);
    } catch (error) {
      console.error('Error handling message:', error.message);
    }
  }

  private async getUserIdFromSocket(client: any) {
    try {
      const validatedUser = await this.authService.validateUser(
        client.handshake?.auth?.token,
      );

      if (!validatedUser) {
        throw new Error('User validation failed');
      }

      return validatedUser;
    } catch (error) {
      console.error('Error getting user ID from socket: ', error.message);
    }
  }
}
