import { ApiProperty } from '@nestjs/swagger';
import { PaymentStatus } from '@prisma/client';
import { Expose, Type } from 'class-transformer';
import { IsBoolean, IsDate, IsEnum, IsNotEmpty } from 'class-validator';

export class CreateDepositDto {
  @ApiProperty()
  @IsEnum(PaymentStatus)
  // @Expose()
  status: PaymentStatus = PaymentStatus.Pending;

  @ApiProperty()
  @IsBoolean()
  @Expose()
  isDeposited: boolean = false;

  @ApiProperty()
  @IsBoolean()
  @Expose()
  isBlocked: boolean = false;

  @ApiProperty()
  @IsDate({
    message: 'Invalid date of birth format. Use ISO-8601 DateTime format.',
  })
  @IsNotEmpty()
  @Type(() => Date)
  @Expose()
  expiration: Date;
}
