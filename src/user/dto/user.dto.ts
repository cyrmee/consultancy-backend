import { Role } from '@prisma/client';
import { Expose } from 'class-transformer';

export class UserForNotificationDto {
  @Expose() id: string;
  @Expose() email: string;
  @Expose() firstName: string;
  @Expose() lastName: string;
  @Expose() roles: Role[];
}

export class UserDto {
  @Expose() id: string;
  @Expose() email: string;
  @Expose() firstName: string;
  @Expose() lastName: string;
  @Expose() phoneNumber: string;
  @Expose() access_token: string;
  @Expose() expires_in: number;
  @Expose() calendarId: string;
  @Expose() roles: Role[];
}
