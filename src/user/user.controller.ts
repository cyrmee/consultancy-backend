import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Patch,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { UserService } from './user.service';
import { JwtGuard, RolesGuard } from '../auth/guard';
import { GetUser, Roles } from '../auth/decorator';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { EmployeeUserDto, StudentUserDto } from '../auth/dto';
import { EditUserDto } from './dto';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { FileService } from '../common/files.service';

@ApiBearerAuth()
@UseGuards(JwtGuard, RolesGuard)
@ApiTags('user')
@Roles(Role.Admin, Role.Agent, Role.Admission, Role.Finance, Role.Visa)
@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly fileService: FileService,
  ) {}

  @Get('student/profile')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.Student)
  async getStudentProfile(
    @GetUser('id') userId: string,
  ): Promise<EmployeeUserDto | StudentUserDto> {
    return await this.userService.getStudentProfile(userId);
  }

  @Get('employee/profile')
  @HttpCode(HttpStatus.OK)
  async getEmployeeProfile(
    @GetUser('id') userId: string,
  ): Promise<EmployeeUserDto> {
    return await this.userService.getEmployeeProfile(userId);
  }

  @Get('usersForNotification')
  @ApiQuery({ name: 'role', required: false })
  @Roles(Role.Admin, Role.Agent, Role.Admission, Role.Finance, Role.Visa)
  async getUsersForNotification(@Query('role') roles?: Role[]) {
    if (typeof roles === 'string') {
      if (!Object.values(Role).includes(roles as Role)) {
        throw new BadRequestException('Invalid roles parameter');
      }
    } else if (Array.isArray(roles)) {
      const invalidRoles = roles.filter(
        (role) => !Object.values(Role).includes(role),
      );
      if (invalidRoles.length > 0) {
        throw new BadRequestException('Invalid roles parameter');
      }
    }
    return await this.userService.getUsersForNotification(roles);
  }

  @Patch('student')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBody({ type: () => EditUserDto })
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.Student)
  async updateStudentProfile(
    @Body() editUserDto: EditUserDto,
    @GetUser('id') userId: string,
  ): Promise<void> {
    return await this.userService.updateStudentProfile(editUserDto, userId);
  }

  @Patch('student/image')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        profileImage: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.Student)
  @UseInterceptors(
    FileFieldsInterceptor([{ name: 'profileImage', maxCount: 1 }]),
  )
  async editStudentImage(
    @UploadedFiles()
    files: {
      profileImage: Express.Multer.File[];
    },
    @GetUser('id') userId: string,
  ): Promise<void> {
    try {
      if (!files.profileImage)
        throw new BadRequestException('File is missing.');

      if (
        files.profileImage[0].mimetype !== 'image/jpeg' &&
        files.profileImage[0].mimetype !== 'image/png' &&
        files.profileImage[0].mimetype !== 'image/gif'
      ) {
        throw new BadRequestException('Only image files are allowed.');
      }

      const maxFileSize = 2 * 1024 * 1024; // 2 MB
      if (files.profileImage[0].size > maxFileSize)
        throw new BadRequestException('File size exceeds the limit of 2 MB');

      const studentId = await this.userService.getStudentId(userId);
      const identifier = `${studentId}`;

      const filename = await this.fileService.uploadFile(
        files.profileImage[0],
        identifier,
      );
      await this.userService.editImage(studentId, filename);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new BadRequestException({ error: error.message });
    }
  }
}
