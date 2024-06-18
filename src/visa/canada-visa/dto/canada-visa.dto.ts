import {
  CanadaVisaApplicationStatus,
  DepositPaymentStatus,
  VisaApplicationAndBiometricFeeStatus,
  VisaPaymentStatus,
} from '@prisma/client';
import { Expose, Type } from 'class-transformer';
import { ApplicationDto } from '../../../base/dto';

export class CanadaVisaDto {
  @Expose() id: string;
  @Expose() requiredDocumentsRequested: boolean;
  @Expose() requiredDocumentsReceived: boolean;
  @Expose() visaApplicationAndBiometricFeeAmount: number;
  @Expose() visaApplicationAndBiometricFee: VisaPaymentStatus;
  @Expose() biometricSubmissionDate: Date;
  @Expose() serviceFeeDepositDate: Date;
  @Expose() serviceFeeDepositPaymentStatus: DepositPaymentStatus;

  @Expose()
  visaApplicationAndBiometricSubmitted: VisaApplicationAndBiometricFeeStatus;

  @Expose() paymentConfirmationFileUri: string;
  @Expose() applicationConfirmationFileUri: string;
  @Expose() confirmationSent: boolean;
  @Expose() confirmationReceived: boolean;
  @Expose() visaAccepted: boolean;
  @Expose() visaStatusNotificationSent: boolean;
  @Expose() visaStatusNotificationSentAt: Date;
  @Expose() visaApplicationStatus: CanadaVisaApplicationStatus;
  @Expose() @Type(() => ApplicationDto) application: ApplicationDto;
}
