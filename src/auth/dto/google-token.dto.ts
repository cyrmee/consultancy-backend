import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class EditGoogleTokenDto {
  @Expose() @ApiProperty() @IsNotEmpty() @IsString() access_token: string;
  @Expose() @ApiProperty() @IsNotEmpty() @IsNumber() expires_in: number;
}
