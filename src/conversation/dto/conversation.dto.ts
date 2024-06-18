import { Expose, Type } from 'class-transformer';
import { ForumMessageDto, MessageDto } from '../../message/dto';
import { ConversationType, Role } from '@prisma/client';

export class UserDto {
  @Expose() id: string;
  @Expose() email: string;
  @Expose() firstName: string;
  @Expose() lastName: string;
  @Expose() phoneNumber: string;
  @Expose() roles: Role[];
}

export class ForumConversationDto {
  @Expose() id: string;
  @Expose() title: string;
  @Expose() @Type(() => UserDto) participants: UserDto[];
  @Expose() type: ConversationType;
  @Expose() @Type(() => ForumMessageDto) forumMessage: ForumMessageDto[];
}

export class ConversationDto {
  @Expose() id: string;
  @Expose() title: string;
  @Expose() @Type(() => UserDto) participants: UserDto[];
  @Expose() type: ConversationType;
  @Expose() @Type(() => MessageDto) messages: MessageDto[];
}

export class ConversationWithoutMessagesDto {
  @Expose() id: string;
  @Expose() title: string;
  @Expose() @Type(() => UserDto) participants: UserDto[];
  @Expose() type: ConversationType;
  @Expose() @Type(() => MessageDto) messages: MessageDto[];
  @Expose() _count: number = 0;
}

export class ForumWithoutMessagesDto {
  @Expose() id: string;
  @Expose() title: string;
  @Expose() @Type(() => UserDto) participants: UserDto[];
  @Expose() type: ConversationType;
  @Expose() @Type(() => MessageDto) messages: MessageDto[];
  @Expose() _count: number = 0;
}
