import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateCommentDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Expose()
  text: string;

  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  @Expose()
  applicationId: string;

  @ApiProperty()
  @IsOptional()
  @Expose()
  parentId?: string;
}
