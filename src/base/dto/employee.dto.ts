import { Gender } from '@prisma/client';
import { Expose, Type } from 'class-transformer';
import { UserDto } from '../../user/dto';

export class EmployeeDto {
  @Expose() id: string;
  @Expose() firstName: string;
  @Expose() lastName: string;
  @Expose() gender: Gender;
  @Expose() dateOfBirth?: Date;
  @Expose() @Type(() => UserDto) user: UserDto;
}
