import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreatePostDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Expose()
  title: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Expose()
  description: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  @Expose()
  videoLink?: string;

  image: string;
}
