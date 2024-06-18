import { Operation } from '@prisma/client';
import { Expose, Type } from 'class-transformer';
import { EmployeeUserDto } from '../../auth/dto';

export class AuditDto {
  @Expose() id: string;
  @Expose() createdAt: Date;
  @Expose() @Type(() => EmployeeUserDto) user: EmployeeUserDto;
  @Expose() entity: string;
  @Expose() recordId: string;
  @Expose() note: string;
  @Expose() detail: string;
  @Expose() operation: Operation;
}
