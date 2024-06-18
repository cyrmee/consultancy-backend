import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { GetUser, Roles } from '../auth/decorator';
import { JwtGuard, RolesGuard } from '../auth/guard';
import { NotificationService } from './notification.service';
import {
  CreateNotificationDto,
  CreateUserNotificationDto,
  NotificationDto,
} from './dto';
import { EmployeeUserDto, StudentUserDto } from '../auth/dto';

@ApiBearerAuth()
@UseGuards(JwtGuard, RolesGuard)
@Roles(Role.Admin, Role.Agent, Role.Admission, Role.Finance, Role.Visa)
@ApiTags('notification')
@Controller('notification')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  async getNotifications(
    @GetUser() user: EmployeeUserDto,
  ): Promise<NotificationDto[]> {
    return await this.notificationService.getNotifications(user);
  }

  @Get('student')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.Student)
  async getNotificationsForStudent(
    @GetUser() user: StudentUserDto,
  ): Promise<NotificationDto[]> {
    return await this.notificationService.getNotificationsForStudent(user);
  }

  @Get('student/count')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.Student)
  async getNewNotificationCountForStudent(
    @GetUser() user: StudentUserDto,
  ): Promise<number> {
    return await this.notificationService.getNewNotificationCountForStudent(
      user,
    );
  }

  @Get('employee')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.Admin, Role.Agent, Role.Finance, Role.Admission, Role.Visa)
  async getNotificationsForEmployee(
    @GetUser() user: EmployeeUserDto,
  ): Promise<NotificationDto[]> {
    return await this.notificationService.getNotificationsForEmployee(user);
  }

  @Get('employee/count')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.Admin, Role.Agent, Role.Finance, Role.Admission, Role.Visa)
  async getNewNotificationCountForEmployee(
    @GetUser() user: EmployeeUserDto,
  ): Promise<number> {
    return await this.notificationService.getNewNotificationCountForEmployee(
      user,
    );
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiBody({ type: () => CreateNotificationDto })
  async sendNotification(
    @Body() createNotificationDto: CreateNotificationDto,
    @GetUser() user: EmployeeUserDto,
  ): Promise<void> {
    createNotificationDto.senderId = user.id;
    await this.notificationService.sendNotification(createNotificationDto);
  }

  @Post('user-token')
  @HttpCode(HttpStatus.CREATED)
  @ApiBody({ type: () => CreateUserNotificationDto })
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.Student)
  async addUserTokenToDatabase(
    @Body() createUserNotificationDto: CreateUserNotificationDto,
  ): Promise<void> {
    await this.notificationService.addUserTokenToDatabase(
      createUserNotificationDto,
    );
  }
}
