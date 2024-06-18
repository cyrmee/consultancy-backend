import { Expose, Type } from 'class-transformer';
import { ApplicationDto } from '../../base/dto';
import { EnglishTestRequiredStatus } from '@prisma/client';

export class EnglishTestDto {
  @Expose() practiceLink: string;
  @Expose() practiceLink2: string;
  @Expose() testDate: Date;
  @Expose() score?: string;
  @Expose() email: string;
  @Expose() password: string;
  @Expose() hasPassed?: boolean;
  @Expose() @Type(() => ApplicationDto) application: ApplicationDto;
}

export class ApplicationEnglishTestDto {
  @Expose() englishTestRequired?: EnglishTestRequiredStatus;
  @Expose() @Type(() => EnglishTestDto) englishTest: EnglishTestDto;
}
