import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CreateUserNotificationDto {
  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  @Expose()
  userId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Expose()
  expoToken: string;
}
