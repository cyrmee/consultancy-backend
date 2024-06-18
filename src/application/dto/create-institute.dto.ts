import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateInstituteDto {
  @ApiProperty()
  @Expose()
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty()
  @Expose()
  @IsOptional()
  @IsString()
  comment?: string;

  @ApiProperty()
  @Expose()
  @IsNotEmpty()
  @IsUUID()
  applicationId: string;
}
