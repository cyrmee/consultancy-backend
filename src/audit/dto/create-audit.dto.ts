import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { Operation } from '@prisma/client';

export class CreateAuditDto {
  @IsNotEmpty() @IsString() entity: string;
  @IsNotEmpty() @IsString() recordId: string;
  @IsNotEmpty() @IsUUID() userId: string;
  @IsNotEmpty() @IsString() previousValues: string;
  @IsOptional() @IsString() detail?: string = '';
  @IsNotEmpty() @IsEnum(Operation) operation: Operation;
}
