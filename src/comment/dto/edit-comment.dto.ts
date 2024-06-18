import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class EditCommentDto {
  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  @Expose()
  id: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  @Expose()
  text?: string;

  @ApiProperty()
  @IsOptional()
  @Expose()
  parentId?: string;
}
