import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsNotEmpty, IsUUID } from 'class-validator';

export class CreateCanadaVisaDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsUUID()
  @Expose()
  applicationId: string;
}
