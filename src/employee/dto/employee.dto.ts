import { Gender, Role } from '@prisma/client';
import { Expose, Type } from 'class-transformer';
import { UserDto } from '../../user/dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

export class EmployeeFilterDto {
  @ApiProperty() @Expose() @IsEnum(Gender) gender: Gender;
  @ApiProperty() @Expose() @IsEnum(Role) role: Role;
}

export class EmployeeDto {
  @Expose() id: string;
  @Expose() firstName: string;
  @Expose() lastName: string;
  @Expose() gender: Gender;
  @Expose() dateOfBirth?: Date;
  @Expose() @Type(() => UserDto) user: UserDto;
}
