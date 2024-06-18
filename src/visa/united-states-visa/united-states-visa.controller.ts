import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Patch,
  Post,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { Role, UnitedStatesVisaApplicationStatus } from '@prisma/client';
import { UnitedStatesVisaService } from './united-states-visa.service';
import {
  CreateInterviewTrainingScheduleDto,
  EditInterviewTrainingScheduleDto,
  EditUnitedStatesVisaDto,
  InterviewTrainingScheduleDto,
  UnitedStatesVisaDto,
} from './dto';
import { GetUser, Roles } from '../../auth/decorator';
import { JwtGuard, RolesGuard } from '../../auth/guard';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { FileService } from '../../common/files.service';
import { EmployeeUserDto } from '../../auth/dto';

@ApiBearerAuth()
@ApiTags('united-states-visa')
@UseGuards(JwtGuard, RolesGuard)
@Roles(Role.Admin, Role.Admission, Role.Finance, Role.Visa)
@Controller('united-states-visa')
export class UnitedStatesVisaController {
  constructor(
    private readonly unitedStatesVisaService: UnitedStatesVisaService,
    private readonly fileService: FileService,
  ) {}

  @Get(':applicationId')
  async getVisaByApplicationId(
    @Param('applicationId') applicationId: string,
  ): Promise<UnitedStatesVisaDto> {
    return await this.unitedStatesVisaService.getVisaByApplicationId(
      applicationId,
    );
  }

  @Get('mobile/:applicationId')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.Student)
  async getVisaByApplicationIdForLoggedInStudent(
    @Param('applicationId') applicationId: string,
    @GetUser('id') userId: string,
  ): Promise<UnitedStatesVisaDto> {
    return await this.unitedStatesVisaService.getVisaByApplicationIdForLoggedInStudent(
      userId,
      applicationId,
    );
  }

  @Get('interviewTrainingSchedule/:unitedStatesVisaId')
  async getInterviewTrainingSchedule(
    @Param('unitedStatesVisaId') unitedStatesVisaId: string,
  ): Promise<InterviewTrainingScheduleDto[]> {
    return await this.unitedStatesVisaService.getInterviewTrainingSchedule(
      unitedStatesVisaId,
    );
  }

  @Patch('editRequiredVisaDocuments')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBody({ type: () => EditUnitedStatesVisaDto })
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.Admin, Role.Visa)
  async editRequiredVisaDocuments(
    @Body() editUnitedStatesVisaDto: EditUnitedStatesVisaDto,
    @GetUser() user: EmployeeUserDto,
  ): Promise<void> {
    return await this.unitedStatesVisaService.editRequiredVisaDocuments(
      editUnitedStatesVisaDto,
      user,
    );
  }

  @Patch('editVisaFeePaymentStatus')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBody({ type: () => EditUnitedStatesVisaDto })
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.Admin, Role.Visa)
  async editVisaFeePaymentStatus(
    @Body() editUnitedStatesVisaDto: EditUnitedStatesVisaDto,
    @GetUser() user: EmployeeUserDto,
  ): Promise<void> {
    return await this.unitedStatesVisaService.editVisaFeePaymentStatus(
      editUnitedStatesVisaDto,
      user,
    );
  }

  @Get('visaFeeFile/:id')
  async getVisaFeeFile(@Param('id') id: string): Promise<string> {
    return await this.unitedStatesVisaService.getVisaFeeFile(id);
  }

  @Patch('uploadVisaFeeFile/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.Admin, Role.Visa)
  @UseInterceptors(FileFieldsInterceptor([{ name: 'file', maxCount: 1 }]))
  async uploadVisaFeeFile(
    @UploadedFiles()
    files: {
      file: Express.Multer.File[];
    },
    @Param('id') id: string,
    @GetUser() user: EmployeeUserDto,
  ): Promise<void> {
    try {
      if (!files.file) throw new BadRequestException('File is missing');

      if (files.file[0].mimetype !== 'application/pdf')
        throw new BadRequestException('Only PDF files are allowed.');

      const maxFileSize = 4 * 1024 * 1024; // 4 MB
      if (files.file[0].size > maxFileSize)
        throw new BadRequestException('File size exceeds the limit of 4 MB');

      const identifier = `visaFee-${id}`;
      const visaApplicationStatus =
        await this.unitedStatesVisaService.getVisaApplicationStatusById(id);

      if (await this.unitedStatesVisaService.visaExists(id)) {
        if (
          visaApplicationStatus ==
          UnitedStatesVisaApplicationStatus.DocumentsReceived
        ) {
          const filename = await this.fileService.uploadFile(
            files.file[0],
            identifier,
          );
          await this.unitedStatesVisaService.uploadVisaFeeFile(
            id,
            filename,
            user,
          );
        } else
          throw new BadRequestException(
            `Visa status in: ${visaApplicationStatus}`,
          );
      } else throw new NotFoundException(`No visa found with ${id}`);
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      if (error instanceof NotFoundException) throw error;
      throw new BadRequestException({ error: error.message });
    }
  }

  @Post('interviewTrainingSchedule')
  @HttpCode(HttpStatus.CREATED)
  @ApiBody({ type: () => CreateInterviewTrainingScheduleDto })
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.Admin, Role.Visa)
  async createInterviewTrainingSchedule(
    @Body()
    createInterviewTrainingScheduleDto: CreateInterviewTrainingScheduleDto,
    @GetUser() user: EmployeeUserDto,
  ): Promise<void> {
    await this.unitedStatesVisaService.createInterviewTrainingSchedule(
      createInterviewTrainingScheduleDto,
      user,
    );
  }

  @Patch('interviewTrainingSchedule')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBody({ type: () => EditInterviewTrainingScheduleDto })
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.Admin, Role.Visa)
  async editInterviewTrainingSchedule(
    @Body()
    editInterviewTrainingScheduleDto: EditInterviewTrainingScheduleDto,
    @GetUser() user: EmployeeUserDto,
  ): Promise<void> {
    return await this.unitedStatesVisaService.editInterviewTrainingSchedule(
      editInterviewTrainingScheduleDto,
      user,
    );
  }

  @Patch('interviewTrainingScheduleStatus')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBody({ type: () => EditUnitedStatesVisaDto })
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.Admin, Role.Visa)
  async editInterviewTrainingScheduleStatus(
    @Body()
    editUnitedStatesVisaDto: EditUnitedStatesVisaDto,
    @GetUser() user: EmployeeUserDto,
  ): Promise<void> {
    return await this.unitedStatesVisaService.editInterviewTrainingScheduleStatus(
      editUnitedStatesVisaDto,
      user,
    );
  }

  @Patch('editServiceFeeDepositPaymentStatus')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBody({ type: () => EditUnitedStatesVisaDto })
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.Admin, Role.Visa)
  async editServiceFeeDepositPaymentStatus(
    @Body() editUnitedStatesVisaDto: EditUnitedStatesVisaDto,
    @GetUser() user: EmployeeUserDto,
  ): Promise<void> {
    return await this.unitedStatesVisaService.editServiceFeeDepositPaymentStatus(
      editUnitedStatesVisaDto,
      user,
    );
  }

  @Patch('editInterviewScheduleStatus')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBody({ type: () => EditUnitedStatesVisaDto })
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.Admin, Role.Visa)
  async editInterviewScheduleStatus(
    @Body() editUnitedStatesVisaDto: EditUnitedStatesVisaDto,
    @GetUser() user: EmployeeUserDto,
  ): Promise<void> {
    return await this.unitedStatesVisaService.editInterviewScheduleStatus(
      editUnitedStatesVisaDto,
      user,
    );
  }

  @Patch('interviewSchedule')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBody({ type: () => EditUnitedStatesVisaDto })
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.Admin, Role.Visa)
  async editInterviewSchedule(
    @Body()
    editUnitedStatesVisaDto: EditUnitedStatesVisaDto,
    @GetUser() user: EmployeeUserDto,
  ): Promise<void> {
    await this.unitedStatesVisaService.editInterviewSchedule(
      editUnitedStatesVisaDto,
      user,
    );
  }

  @Patch('sevisPayment')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBody({ type: () => EditUnitedStatesVisaDto })
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.Admin, Role.Visa)
  async editSevisPayment(
    @Body()
    editUnitedStatesVisaDto: EditUnitedStatesVisaDto,
    @GetUser() user: EmployeeUserDto,
  ): Promise<void> {
    return await this.unitedStatesVisaService.editSevisPayment(
      editUnitedStatesVisaDto,
      user,
    );
  }

  @Patch('visaStatus')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBody({ type: () => EditUnitedStatesVisaDto })
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.Admin, Role.Visa)
  async editVisaStatus(
    @Body()
    editUnitedStatesVisaDto: EditUnitedStatesVisaDto,
    @GetUser() user: EmployeeUserDto,
  ): Promise<void> {
    return await this.unitedStatesVisaService.editVisaStatus(
      editUnitedStatesVisaDto,
      user,
    );
  }

  @Patch('visaApplicationStatus')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBody({ type: () => EditUnitedStatesVisaDto })
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.Admin, Role.Visa)
  async editUnitedStatesVisaApplicationStatus(
    @Body()
    editUnitedStatesVisaDto: EditUnitedStatesVisaDto,
    @GetUser() user: EmployeeUserDto,
  ): Promise<void> {
    return await this.unitedStatesVisaService.editUnitedStatesVisaApplicationStatus(
      editUnitedStatesVisaDto,
      user,
    );
  }

  @Delete('interviewTrainingSchedule/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.Admin, Role.Visa)
  async deleteInterviewTrainingSchedule(
    @Param('id') id: string,
    @GetUser() user: EmployeeUserDto,
  ): Promise<void> {
    return await this.unitedStatesVisaService.deleteInterviewTrainingSchedule(
      id,
      user,
    );
  }
}
