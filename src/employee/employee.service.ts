import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Gender, Role } from '@prisma/client';
import {
  EmployeeDto,
  CreateEmployeeDto,
  EditEmployeeDto,
  EmployeeFilterDto as EmployeeFilterDto,
} from './dto';
import * as argon from 'argon2';
import { plainToInstance } from 'class-transformer';
import { PrismaService } from '../prisma/prisma.service';
import { IsString, IsEnum, validate } from 'class-validator';
import { MailService } from '../mail/mail.service';

@Injectable()
export class EmployeeService {
  constructor(
    private readonly database: PrismaService,
    private readonly mailService: MailService,
  ) {}

  private async validateType(fieldName: string, value: string, enumType: any) {
    class Dto {
      @IsString()
      @IsEnum(enumType)
      value: any;
    }
    const dto = new Dto();
    dto.value = value as any;

    const errors = await validate(dto);
    if (errors.length > 0) {
      throw new BadRequestException(
        `${fieldName} ${errors[0].constraints.isEnum}`,
      );
    }
  }

  async queryEmployees(
    filter: EmployeeFilterDto,
    query: string,
    page: number = 1,
    pageSize: number = 15,
  ): Promise<{ employees: EmployeeDto[]; totalCount: number; pages: number }> {
    try {
      if (filter.gender) {
        await this.validateType('gender', filter.gender, Gender);
      }
      if (filter.role) {
        await this.validateType('role', filter.role, Role);
      }

      const skipCount = (page - 1) * pageSize;
      const employees = await this.database.employee.findMany({
        where: {
          AND: [
            filter.gender ? { gender: filter.gender as Gender } : {},
            filter.role
              ? {
                  user: {
                    roles: { has: filter.role as Role },
                    NOT: { roles: { has: Role.Admin } },
                  },
                }
              : {},
            query
              ? {
                  OR: [
                    { firstName: { contains: query, mode: 'insensitive' } },
                    { lastName: { contains: query, mode: 'insensitive' } },
                    {
                      user: {
                        OR: [
                          {
                            email: {
                              contains: query,
                              mode: 'insensitive',
                            },
                          },
                          {
                            phoneNumber: {
                              contains: query,
                              mode: 'insensitive',
                            },
                          },
                        ],
                      },
                    },
                  ],
                }
              : {},
            {},
          ],
          user: {
            NOT: { roles: { has: Role.Admin } },
          },
        },
        include: {
          user: true,
        },
        skip: skipCount,
        take: pageSize,
        orderBy: { firstName: 'asc' },
      });

      const totalCount = await this.database.employee.count({
        where: {
          AND: [
            filter.gender ? { gender: filter.gender as Gender } : {},
            filter.role
              ? {
                  user: {
                    roles: { has: filter.role as Role },
                    NOT: { roles: { has: Role.Admin } },
                  },
                }
              : {},
            query
              ? {
                  OR: [
                    { firstName: { contains: query, mode: 'insensitive' } },
                    { lastName: { contains: query, mode: 'insensitive' } },
                    {
                      user: {
                        OR: [
                          {
                            email: {
                              contains: query,
                              mode: 'insensitive',
                            },
                          },
                          {
                            phoneNumber: {
                              contains: query,
                              mode: 'insensitive',
                            },
                          },
                        ],
                      },
                    },
                  ],
                }
              : {},
            {},
          ],
          user: {
            NOT: { roles: { has: Role.Admin } },
          },
        },
      });

      return {
        employees: plainToInstance(EmployeeDto, employees, {
          excludeExtraneousValues: true,
        }),
        totalCount: totalCount,
        pages: Math.ceil(totalCount / pageSize),
      };
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async getEmployee(employeeId: string): Promise<EmployeeDto> {
    try {
      const employee = await this.database.employee.findUnique({
        where: {
          id: employeeId,
          user: {
            NOT: { roles: { has: Role.Admin } },
          },
        },
        include: {
          user: true,
        },
      });

      if (!employee)
        throw new NotFoundException(
          `Employee with ID ${employeeId} not found.`,
        );

      return plainToInstance(EmployeeDto, employee, {
        excludeExtraneousValues: true,
      });
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async createEmployee(createEmployeeDto: CreateEmployeeDto): Promise<void> {
    try {
      if (createEmployeeDto.roles.includes(Role.Admin))
        throw new BadRequestException(`Cannot create admins`);

      await this.database.employee.create({
        data: {
          firstName: createEmployeeDto.firstName,
          lastName: createEmployeeDto.lastName,
          gender: createEmployeeDto.gender,
          dateOfBirth: createEmployeeDto.dateOfBirth,
          user: {
            create: {
              email: createEmployeeDto.email,
              firstName: createEmployeeDto.firstName,
              lastName: createEmployeeDto.lastName,
              phoneNumber: createEmployeeDto.phoneNumber,
              gender: createEmployeeDto.gender,
              hash: await argon.hash(createEmployeeDto.password),
              roles: createEmployeeDto.roles,
              isEmailVerified: true,
              isPhoneNumberVerified: true,
            },
          },
        },
        include: {
          user: true,
        },
      });

      await this.mailService.sendEmployeePasswordViaEmail(
        createEmployeeDto.email,
        createEmployeeDto.password,
      );
    } catch (error) {
      console.error(error);
      if (error.code === 'P2002')
        throw new BadRequestException(`${error.meta.target} already exists`);
      else if (error.code === 'P2025')
        throw new BadRequestException(`${error.meta.cause}`);
      throw error;
    }
  }

  async editEmployee(editEmployeeDto: EditEmployeeDto): Promise<void> {
    try {
      if (editEmployeeDto.roles && editEmployeeDto.roles.includes(Role.Admin))
        throw new BadRequestException(`Cannot add admin roles`);

      const employee = await this.database.employee.findUnique({
        where: {
          id: editEmployeeDto.id,
          user: {
            NOT: { roles: { has: Role.Admin } },
          },
        },
        include: {
          user: true,
        },
      });

      if (!employee)
        throw new NotFoundException(
          `Employee with ID ${editEmployeeDto.id} not found.`,
        );

      await this.database.employee.update({
        where: { id: editEmployeeDto.id },
        data: {
          firstName: editEmployeeDto.firstName,
          lastName: editEmployeeDto.lastName,
          gender: editEmployeeDto.gender,
          dateOfBirth: editEmployeeDto.dateOfBirth,
          isSuspended: editEmployeeDto.isSuspended,
          updatedAt: new Date(Date.now()),
          user: {
            update: {
              email: editEmployeeDto.email,
              firstName: editEmployeeDto.firstName,
              lastName: editEmployeeDto.lastName,
              phoneNumber: editEmployeeDto.phoneNumber,
              gender: editEmployeeDto.gender,
              hash: editEmployeeDto.password
                ? await argon.hash(editEmployeeDto.password)
                : employee.user.hash,
              roles: {
                set: editEmployeeDto.roles
                  ? editEmployeeDto.roles
                  : employee.user.roles,
              },
              updatedAt: new Date(Date.now()),
            },
          },
        },
      });
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async deleteEmployee(employeeId: string): Promise<void> {
    try {
      const employee = await this.database.employee.findUnique({
        where: {
          id: employeeId,
          user: {
            NOT: { roles: { has: Role.Admin } },
          },
        },
        include: {
          user: true,
        },
      });

      if (!employee)
        throw new NotFoundException(
          `Employee with ID ${employeeId} not found.`,
        );

      if (employee.user.roles.includes(Role.Admin))
        throw new BadRequestException(`Cannot delete admins`);

      await this.database.user.delete({
        where: { id: employee.user.id },
      });
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
}
