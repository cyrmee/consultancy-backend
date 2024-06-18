import { ApiProperty } from '@nestjs/swagger';
import { PaymentStatus } from '@prisma/client';
import { Expose, Type } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsUUID,
} from 'class-validator';

export class EditDepositDto {
  @IsEnum(PaymentStatus)
  @IsOptional()
  status?: PaymentStatus = PaymentStatus.Pending;

  @ApiProperty()
  @IsBoolean()
  @IsNotEmpty()
  @Expose()
  isDeposited: boolean;

  @ApiProperty()
  @IsBoolean()
  @IsNotEmpty()
  @Expose()
  isBlocked: boolean;

  @ApiProperty()
  @IsDate({
    message: 'Invalid date of birth format. Use ISO-8601 DateTime format.',
  })
  @IsOptional()
  @Type(() => Date)
  @Expose()
  expiration?: Date;

  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  @Expose()
  applicationId: string;
}
