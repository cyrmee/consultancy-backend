import { ApiProperty } from '@nestjs/swagger';
import { AdditionalFileType } from '@prisma/client';
import { Expose } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateAdditionalStudentFilesDto {
  @ApiProperty() @Expose() @IsNotEmpty() @IsString() studentId: string;

  @ApiProperty()
  @Expose()
  @IsNotEmpty()
  @IsEnum(AdditionalFileType)
  fileType: AdditionalFileType;

  @IsOptional() @IsString() fileUri: string;
}
