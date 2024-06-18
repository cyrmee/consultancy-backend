import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsString, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

export class EditPostDto {
  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  @Expose()
  id: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  @Expose()
  title?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  @Expose()
  description?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  @Expose()
  videoLink?: string;

  image?: string;
}
