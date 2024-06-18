import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiTags } from '@nestjs/swagger';
import {
  CreateEnglishTestDto,
  EditEnglishTestDto,
  ApplicationEnglishTestDto,
} from './dto';
import { EnglishTestService } from './english-test.service';
import { Role } from '@prisma/client';
import { GetUser, Roles } from '../auth/decorator';
import { JwtGuard, RolesGuard } from '../auth/guard';
import { EmployeeUserDto } from '../auth/dto';

@ApiBearerAuth()
@ApiTags('english-test')
@UseGuards(JwtGuard, RolesGuard)
@Roles(Role.Admin, Role.Admission)
@Controller('english-test')
export class EnglishTestController {
  constructor(private readonly englishTestService: EnglishTestService) {}

  @Get(':applicationId')
  async getEnglishTest(
    @Param('applicationId') applicationId: string,
  ): Promise<ApplicationEnglishTestDto> {
    return await this.englishTestService.getEnglishTest(applicationId);
  }

  @Get('mobile/:applicationId')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.Student)
  async getEnglishTestForLoggedInStudent(
    @Param('applicationId') applicationId: string,
    @GetUser('id') userId: string,
  ): Promise<ApplicationEnglishTestDto> {
    return await this.englishTestService.getEnglishTestForLoggedInStudent(
      userId,
      applicationId,
    );
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiBody({ type: () => CreateEnglishTestDto })
  async createEnglishTest(
    @Body() createEnglishTestDto: CreateEnglishTestDto,
    @GetUser() user: EmployeeUserDto,
  ): Promise<void> {
    await this.englishTestService.createEnglishTest(createEnglishTestDto, user);
  }

  @Patch()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBody({ type: () => EditEnglishTestDto })
  async editEnglishTest(
    @Body() editEnglishTestDto: EditEnglishTestDto,
    @GetUser() user: EmployeeUserDto,
  ): Promise<void> {
    await this.englishTestService.editEnglishTest(editEnglishTestDto, user);
  }

  @Delete(':applicationId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteEnglishTest(
    @Param('applicationId') applicationId: string,
    @GetUser() user: EmployeeUserDto,
  ): Promise<void> {
    await this.englishTestService.deleteEnglishTest(applicationId, user);
  }
}
