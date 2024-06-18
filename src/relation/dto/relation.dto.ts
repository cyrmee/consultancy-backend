import { Relationship } from '@prisma/client';
import { Expose } from 'class-transformer';

export class StudentRelationsDto {
  @Expose() id: string;
  @Expose() firstName: string;
  @Expose() lastName: string;
  @Expose() phoneNumber?: string;
  @Expose() educationalLevel?: string;
  @Expose() dateOfBirth?: Date;
  @Expose() relationship: Relationship;
}
