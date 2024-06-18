import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { GetUser, Roles } from '../auth/decorator';
import { JwtGuard, RolesGuard } from '../auth/guard';
import { CalendarService } from './calendar.service';
import { EmployeeUserDto } from '../auth/dto';
import { CalendarDto } from './dto';
import { UserDto } from '../user/dto';

@ApiBearerAuth()
@ApiTags('calendar')
@UseGuards(JwtGuard, RolesGuard)
@Roles(Role.Admin, Role.Finance, Role.Visa)
@Controller('calendar')
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  @Get()
  async getCalendars(@GetUser() user: EmployeeUserDto): Promise<CalendarDto[]> {
    return await this.calendarService.getCalendars(user);
  }

  @Get('missed-events')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.Admin, Role.Finance, Role.Visa, Role.Admission, Role.Agent)
  async getMissedEvents(
    @GetUser() user: EmployeeUserDto,
  ): Promise<CalendarDto[]> {
    return await this.calendarService.getMissedEvents(user);
  }

  @Patch('google-sync')
  @HttpCode(HttpStatus.NO_CONTENT)
  async syncCalendars(@GetUser() user: UserDto): Promise<void> {
    return await this.calendarService.syncCalendars(user);
  }
}
