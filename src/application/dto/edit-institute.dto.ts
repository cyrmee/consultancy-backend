import { ApiProperty } from '@nestjs/swagger';
import { AdmissionStatus } from '@prisma/client';
import { Expose } from 'class-transformer';
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';

export class EditInstituteDto {
  @ApiProperty()
  @Expose()
  @IsUUID()
  @IsOptional()
  id?: string;

  @ApiProperty()
  @Expose()
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty()
  @Expose()
  @IsString()
  @IsOptional()
  comment?: string;

  @ApiProperty()
  @Expose()
  @IsEnum(AdmissionStatus)
  @IsOptional()
  admissionStatus?: AdmissionStatus;
}
