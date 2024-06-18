import { ApiProperty } from '@nestjs/swagger';
import {
  DepositPaymentStatus,
  InterviewScheduleStatus,
  UnitedStatesVisaApplicationStatus,
  VisaPaymentStatus,
} from '@prisma/client';
import { Expose, Type } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class EditInterviewTrainingScheduleDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsUUID()
  @Expose()
  id: string;

  @ApiProperty()
  @IsDate({
    message: 'Invalid date of birth format. Use ISO-8601 DateTime format.',
  })
  @IsOptional()
  @Type(() => Date)
  @Expose()
  date?: Date;

  @ApiProperty()
  @IsEnum(InterviewScheduleStatus)
  @IsOptional()
  @Expose()
  status?: InterviewScheduleStatus;
}

export class EditUnitedStatesVisaDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsUUID()
  @Expose()
  id: string;

  @ApiProperty()
  @IsOptional()
  @IsEnum(UnitedStatesVisaApplicationStatus)
  @Expose()
  visaApplicationStatus?: UnitedStatesVisaApplicationStatus;

  @ApiProperty()
  @IsOptional()
  @IsBoolean()
  @Expose()
  requiredDocumentsRequested?: boolean;

  @ApiProperty()
  @IsOptional()
  @IsBoolean()
  @Expose()
  requiredDocumentsReceived?: boolean;

  @ApiProperty()
  @IsOptional()
  @IsString()
  @Expose()
  visaFeeFileUri?: string;

  @ApiProperty()
  @IsOptional()
  @IsEnum(VisaPaymentStatus)
  @Expose()
  visaFeePaymentStatus?: VisaPaymentStatus;

  @ApiProperty()
  @IsOptional()
  @IsEnum(DepositPaymentStatus)
  @Expose()
  serviceFeeDepositPaymentStatus?: DepositPaymentStatus;

  @ApiProperty()
  @IsOptional()
  @IsBoolean()
  @Expose()
  interviewTrainingScheduleComplete?: boolean;

  @ApiProperty()
  @IsOptional()
  @IsDate({
    message: 'Invalid date of birth format. Use ISO-8601 DateTime format.',
  })
  @Type(() => Date)
  @Expose()
  interviewSchedule?: Date;

  @ApiProperty()
  @IsOptional()
  @IsBoolean()
  @Expose()
  interviewAttended?: boolean;

  @ApiProperty()
  @IsOptional()
  @IsEnum(VisaPaymentStatus)
  @Expose()
  sevisPaymentStatus?: VisaPaymentStatus;

  @ApiProperty()
  @IsOptional()
  @IsBoolean()
  @Expose()
  visaAccepted?: boolean;

  @ApiProperty()
  @IsOptional()
  @IsBoolean()
  @Expose()
  visaStatusNotificationSent?: boolean;

  @ApiProperty()
  @IsOptional()
  @IsDate({
    message: 'Invalid date of birth format. Use ISO-8601 DateTime format.',
  })
  @Type(() => Date)
  @Expose()
  visaStatusNotificationSentAt?: Date;
}
