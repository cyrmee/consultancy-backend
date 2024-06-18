import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role, User } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { PrismaService } from '../prisma/prisma.service';
import { EditUserDto, UserForNotificationDto } from './dto';
import { EmployeeUserDto, StudentUserDto } from '../auth/dto';
import { FileService } from '../common/files.service';

@Injectable()
export class UserService {
  constructor(
    private readonly database: PrismaService,
    private readonly fileService: FileService,
  ) {}

  async getStudentId(userId: string): Promise<string> {
    const user = await this.database.user.findUnique({
      where: { id: userId, roles: { has: Role.Student } },
      include: { student: true },
    });

    if (!user) throw new NotFoundException(`User with ID ${userId} not found.`);

    return user.student.id;
  }

  async getStudentProfile(userId: string): Promise<StudentUserDto> {
    const user = await this.database.user.findUnique({
      where: { id: userId, roles: { has: Role.Student } },
      include: {
        student: true,
      },
    });

    if (!user) throw new ForbiddenException('Credentials incorrect');

    return plainToInstance(StudentUserDto, user, {
      excludeExtraneousValues: true,
    });
  }

  async getEmployeeProfile(userId: string): Promise<EmployeeUserDto> {
    const user = await this.database.user.findUnique({
      where: { id: userId, NOT: { roles: { has: Role.Student } } },
      include: {
        employee: true,
      },
    });

    if (!user) throw new ForbiddenException('Credentials incorrect');

    return plainToInstance(EmployeeUserDto, user, {
      excludeExtraneousValues: true,
    });
  }

  async getUsersForNotification(
    roles?: Role[],
  ): Promise<UserForNotificationDto[]> {
    let users: User[];
    if (typeof roles === 'string') {
      // Single string
      users = await this.database.user.findMany({
        where: { roles: { hasSome: [roles as Role] } },
        orderBy: { firstName: 'asc' },
      });
    } else if (Array.isArray(roles)) {
      // Array of roles
      users = await this.database.user.findMany({
        where: { roles: { hasSome: roles } },
        orderBy: { firstName: 'asc' },
      });
    } else
      users = await this.database.user.findMany({
        orderBy: { firstName: 'asc' },
      });

    return plainToInstance(UserForNotificationDto, users, {
      excludeExtraneousValues: true,
    });
  }

  async updateStudentProfile(
    editUserDto: EditUserDto,
    userId: string,
  ): Promise<void> {
    const existingEmail = await this.database.user.findFirst({
      where: { email: editUserDto.email, id: { not: userId } },
    });

    const existingPhone = await this.database.user.findFirst({
      where: { phoneNumber: editUserDto.phoneNumber, id: { not: userId } },
    });

    try {
      const user = await this.database.user.findUnique({
        where: { id: userId, roles: { has: Role.Student } },
        include: { student: true },
      });

      if (!user) {
        throw new NotFoundException(`User with ID ${userId} not found`);
      }

      if (existingEmail) {
        throw new BadRequestException('Email already exists');
      }

      if (existingPhone) {
        throw new BadRequestException('Phone number already exists');
      }

      if (
        editUserDto.email == user.email &&
        editUserDto.phoneNumber == user.phoneNumber
      ) {
        throw new BadRequestException('No changes detected');
      }

      await this.database.user.update({
        where: { id: userId },
        data: {
          email: editUserDto.email,
          phoneNumber: editUserDto.phoneNumber,
          isEmailVerified: !editUserDto.email ? true : false,
          isPhoneNumberVerified: !editUserDto.phoneNumber ? true : false,
          updatedAt: new Date(Date.now()),
        },
      });
    } catch (error) {
      console.error(error);
      if (error.code === 'P2002') {
        throw new BadRequestException(
          existingEmail
            ? 'Email already exists'
            : 'Phone number already exists',
        );
      }
      throw error;
    }
  }

  async editImage(studentId: string, imageName: string): Promise<void> {
    try {
      const student = await this.database.student.findUnique({
        where: { id: studentId },
      });

      if (student.image) {
        await this.fileService.deleteFileAsync(student.image);
      }

      await this.database.student.update({
        where: { id: studentId },
        data: { image: imageName, updatedAt: new Date(Date.now()) },
      });
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
}
