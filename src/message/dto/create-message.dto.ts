import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsNotEmpty, IsString, IsUUID, Length } from 'class-validator';

export class CreateForumMessageDto {
  @ApiProperty()
  @Expose()
  @IsString()
  @Length(1, 1000)
  @IsNotEmpty()
  content: string;

  @IsUUID()
  @IsNotEmpty()
  senderId: string;

  @ApiProperty()
  @Expose()
  @IsUUID()
  @IsNotEmpty()
  forumId: string;
}

export class CreateMessageDto {
  @ApiProperty()
  @Expose()
  @IsString()
  @Length(1, 1000)
  @IsNotEmpty()
  content: string;

  @IsUUID()
  @IsNotEmpty()
  senderId: string;

  @ApiProperty()
  @Expose()
  @IsUUID()
  @IsNotEmpty()
  recipientId: string;
}
