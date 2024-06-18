import { Role } from '@prisma/client';
import { Expose } from 'class-transformer';

export class CreateUserDto {
  @Expose()
  email: string;

  @Expose()
  roles: Role[];

  @Expose()
  password: string;
}
