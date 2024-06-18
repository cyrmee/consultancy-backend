import {
  DepositPaymentStatus,
  InterviewScheduleStatus,
  UnitedStatesVisaApplicationStatus,
  VisaPaymentStatus,
} from '@prisma/client';
import { Expose, Type } from 'class-transformer';
import { ApplicationDto } from '../../../base/dto';

export class InterviewTrainingScheduleDto {
  @Expose() id: string;
  @Expose() date: Date;
  @Expose() status: InterviewScheduleStatus;
}

export class UnitedStatesVisaDto {
  @Expose() id: string;
  @Expose() visaApplicationStatus: UnitedStatesVisaApplicationStatus;
  @Expose() requiredDocumentsRequested: boolean;
  @Expose() requiredDocumentsReceived: boolean;
  @Expose() visaFeeFileUri: string;
  @Expose() visaFeePaymentStatus: VisaPaymentStatus;
  @Expose() interviewTrainingScheduleComplete: boolean;
  @Expose() interviewSchedule: Date;
  @Expose() serviceFeeDepositDate: Date;
  @Expose() serviceFeeDepositPaymentStatus: DepositPaymentStatus;
  @Expose() interviewAttended: boolean;
  @Expose() sevisPaymentStatus: VisaPaymentStatus;
  @Expose() visaStatusNotificationSent: boolean;
  @Expose() visaStatusNotificationSentAt: Date;
  @Expose() visaAccepted: boolean;
  @Expose() @Type(() => ApplicationDto) application: ApplicationDto;

  @Expose()
  @Type(() => InterviewTrainingScheduleDto)
  interviewTrainingSchedules: InterviewTrainingScheduleDto;
}
