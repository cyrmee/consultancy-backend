import { ApiProperty } from '@nestjs/swagger';
import {
  CanadaVisaApplicationStatus,
  DepositPaymentStatus,
  VisaApplicationAndBiometricFeeStatus,
  VisaPaymentStatus,
} from '@prisma/client';
import { Expose, Type } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class EditCanadaVisaDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsUUID()
  @Expose()
  id: string;

  @ApiProperty()
  @IsOptional()
  @IsEnum(CanadaVisaApplicationStatus)
  @Expose()
  visaApplicationStatus?: CanadaVisaApplicationStatus;

  @ApiProperty()
  @Expose()
  @IsOptional()
  @IsBoolean()
  requiredDocumentsRequested?: boolean;

  @ApiProperty()
  @Expose()
  @IsOptional()
  @IsBoolean()
  requiredDocumentsReceived?: boolean;

  @ApiProperty()
  @Expose()
  @IsOptional()
  @IsNumber()
  visaApplicationAndBiometricFeeAmount?: number;

  @ApiProperty()
  @Expose()
  @IsOptional()
  @IsEnum(VisaPaymentStatus)
  visaApplicationAndBiometricFee?: VisaPaymentStatus;

  @ApiProperty()
  @Expose()
  @IsOptional()
  @IsDate({
    message: 'Invalid date of birth format. Use ISO-8601 DateTime format.',
  })
  @Type(() => Date)
  biometricSubmissionDate?: Date;

  @ApiProperty()
  @Expose()
  @IsOptional()
  @IsDate({
    message: 'Invalid date of birth format. Use ISO-8601 DateTime format.',
  })
  @Type(() => Date)
  serviceFeeDepositDate?: Date;

  @ApiProperty()
  @Expose()
  @IsOptional()
  @IsEnum(DepositPaymentStatus)
  serviceFeeDepositPaymentStatus?: DepositPaymentStatus;

  @ApiProperty()
  @Expose()
  @IsOptional()
  @IsEnum(VisaApplicationAndBiometricFeeStatus)
  visaApplicationAndBiometricSubmitted?: VisaApplicationAndBiometricFeeStatus;

  @ApiProperty()
  @Expose()
  @IsOptional()
  @IsString()
  paymentConfirmation?: string;

  @ApiProperty()
  @Expose()
  @IsOptional()
  @IsString()
  applicationConfirmation?: string;

  @ApiProperty()
  @Expose()
  @IsOptional()
  @IsBoolean()
  confirmationSent?: boolean;

  @ApiProperty()
  @Expose()
  @IsOptional()
  @IsBoolean()
  confirmationReceived?: boolean;

  @ApiProperty() @Expose() @IsOptional() @IsBoolean() visaAccepted?: boolean;

  @ApiProperty()
  @Expose()
  @IsOptional()
  @IsBoolean()
  visaStatusNotificationSent?: boolean;

  @ApiProperty()
  @Expose()
  @IsOptional()
  @IsDate({
    message: 'Invalid date of birth format. Use ISO-8601 DateTime format.',
  })
  @Type(() => Date)
  visaStatusNotificationSentAt?: Date;
}
