import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiTags } from '@nestjs/swagger';
import { JwtGuard, RolesGuard } from '../auth/guard';
import { GetUser, Roles } from '../auth/decorator';
import { Role } from '@prisma/client';
import { DepositService } from './deposit.service';
import { DepositDto, EditDepositDto } from './dto';
import { EmployeeUserDto } from '../auth/dto';

@ApiBearerAuth()
@ApiTags('deposit')
@UseGuards(JwtGuard, RolesGuard)
@Roles(Role.Admin, Role.Agent, Role.Admission, Role.Finance, Role.Visa)
@Controller('deposit')
export class DepositController {
  constructor(private readonly depositService: DepositService) {}

  @Get(':applicationId')
  async getDeposits(
    @Param('applicationId') applicationId: string,
  ): Promise<DepositDto> {
    return await this.depositService.getDeposit(applicationId);
  }

  @Get('mobile/:applicationId')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.Student)
  async getDepositForLoggedInStudent(
    @Param('applicationId') applicationId: string,
    @GetUser('id') userId: string,
  ): Promise<DepositDto> {
    return await this.depositService.getDepositForLoggedInStudent(
      userId,
      applicationId,
    );
  }

  @Patch()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBody({ type: () => EditDepositDto })
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.Admin, Role.Finance)
  async editDeposit(
    @Body() editDepositDto: EditDepositDto,
    @GetUser() user: EmployeeUserDto,
  ): Promise<void> {
    await this.depositService.editDeposit(editDepositDto, user);
  }

  @Delete(':applicationId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.Admin)
  async deleteDeposit(
    @Param('applicationId') applicationId: string,
    @GetUser() user: EmployeeUserDto,
  ): Promise<void> {
    await this.depositService.deleteDeposit(applicationId, user);
  }
}
