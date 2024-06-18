import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class ApplicationCountsDto {
  @ApiProperty() @Expose() depositStatus: number = 0;
  @ApiProperty() @Expose() admissionStatus: number = 0;
  @ApiProperty() @Expose() visaStatus: number = 0;
  @ApiProperty() @Expose() total: number = 0;
}

export class DepositCountsDto {
  @ApiProperty() @Expose() deposited: number = 0;
  @ApiProperty() @Expose() blocked: number = 0;
  @ApiProperty() @Expose() total: number = 0;
}

export class VisaCountsDto {
  @ApiProperty() @Expose() us: number = 0;
  @ApiProperty() @Expose() canada: number = 0;
  @ApiProperty() @Expose() hungary: number = 0;
  @ApiProperty() @Expose() italy: number = 0;
  @ApiProperty() @Expose() total: number = 0;
}

export class AdmissionCountsDto {
  @ApiProperty() @Expose() admissionPending: number = 0;
  @ApiProperty() @Expose() admissionApplying: number = 0;
  @ApiProperty() @Expose() admissionRejected: number = 0;
  @ApiProperty() @Expose() admissionAccepted: number = 0;
  @ApiProperty() @Expose() total: number = 0;
}
