import { ApiProperty } from '@nestjs/swagger';
import { VisaPaymentStatus } from '@prisma/client';
import { Expose, Type } from 'class-transformer';
import { IsDate, IsEnum, IsNotEmpty, IsUUID } from 'class-validator';

export class CreateInterviewTrainingScheduleDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsUUID()
  @Expose()
  unitedStatesVisaId: string;

  @ApiProperty()
  @IsDate({
    message: 'Invalid date of birth format. Use ISO-8601 DateTime format.',
  })
  @IsNotEmpty()
  @Type(() => Date)
  @Expose()
  date: Date;
}

export class CreateUnitedStatesVisaDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsUUID()
  @Expose()
  applicationId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsEnum(VisaPaymentStatus)
  @Expose()
  visaFeePaymentStatus: VisaPaymentStatus = VisaPaymentStatus.Unpaid;

  @ApiProperty()
  @IsNotEmpty()
  @IsEnum(VisaPaymentStatus)
  @Expose()
  sevisPaymentStatus: VisaPaymentStatus = VisaPaymentStatus.Unpaid;
}
