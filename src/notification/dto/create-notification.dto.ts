import { ApiProperty } from '@nestjs/swagger';
import { NotificationType } from '@prisma/client';
import { Expose } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateNotificationDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Expose()
  title: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Expose()
  content: string;

  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  @Expose()
  recipientId: string;

  @IsUUID()
  @IsOptional()
  @Expose()
  senderId: string;

  @IsEnum(NotificationType)
  @IsOptional()
  @Expose()
  type: NotificationType;
}
