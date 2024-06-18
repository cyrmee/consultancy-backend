import { Expose, Type } from 'class-transformer';
import { UserDto } from '../../user/dto';
import { NotificationType } from '@prisma/client';

export class NotificationDto {
  @Expose() title: string;
  @Expose() content: string;
  @Expose() @Type(() => UserDto) sender: UserDto;
  @Expose() @Type(() => UserDto) recipient: UserDto;
  @Expose() @Type(() => UserDto) type: NotificationType;
}
