import { PaymentStatus } from '@prisma/client';
import { Expose } from 'class-transformer';

export class DepositDto {
  @Expose()
  status: PaymentStatus;

  @Expose()
  isDeposited: boolean;

  @Expose()
  isBlocked: boolean;

  @Expose()
  expiration: Date;

  // @Expose()
  // @Type(() => EmployeeDto)
  // agent: EmployeeDto;

  // @Expose()
  // @Type(() => ApplicationDto)
  // application: ApplicationDto;
}
