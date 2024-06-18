import { Expose, Type } from 'class-transformer';

export class UserDto {
  @Expose() id: string;
  @Expose() email: string;
  @Expose() firstName: string;
  @Expose() lastName: string;
  @Expose() phoneNumber: string;
}

export class ForumMessageDto {
  @Expose() id: string;
  @Expose() content: string;
  @Expose() @Type(() => UserDto) sender: UserDto[];
  @Expose() conversationId: string;
  @Expose() sentAt: Date;
  @Expose() read: boolean;
}

export class MessageDto {
  @Expose() id: string;
  @Expose() content: string;
  @Expose() senderId: string;
  @Expose() recipientId: string;
  @Expose() conversationId: string;
  @Expose() sentAt: Date;
  @Expose() read: boolean;
}
