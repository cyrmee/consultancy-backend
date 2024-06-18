import { ApiProperty } from '@nestjs/swagger';
import { AdditionalFileType } from '@prisma/client';
import { Expose } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class EditAdditionalStudentFilesDto {
  @ApiProperty() @Expose() @IsNotEmpty() @IsUUID() id: string;

  @ApiProperty()
  @Expose()
  @IsNotEmpty()
  @IsEnum(AdditionalFileType)
  fileType: AdditionalFileType;

  @IsOptional() @IsString() fileUri: string;
}
