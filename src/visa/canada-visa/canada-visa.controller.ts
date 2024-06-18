import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Patch,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { CanadaVisaService } from './canada-visa.service';
import { CanadaVisaDto, EditCanadaVisaDto } from './dto';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { CanadaVisaApplicationStatus, Role } from '@prisma/client';
import { GetUser, Roles } from '../../auth/decorator';
import { JwtGuard, RolesGuard } from '../../auth/guard';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { FileService } from '../../common/files.service';
import { EmployeeUserDto } from '../../auth/dto';

@ApiBearerAuth()
@ApiTags('canada-visa')
@UseGuards(JwtGuard, RolesGuard)
@Roles(Role.Admin, Role.Admission, Role.Finance, Role.Visa)
@Controller('canada-visa')
export class CanadaVisaController {
  constructor(
    private readonly canadaVisaService: CanadaVisaService,
    private readonly fileService: FileService,
  ) {}

  @Get(':applicationId')
  async getVisaByApplicationId(
    @Param('applicationId') applicationId: string,
  ): Promise<CanadaVisaDto> {
    return await this.canadaVisaService.getVisaByApplicationId(applicationId);
  }

  @Get('mobile/:applicationId')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.Student)
  async getVisaByApplicationIdForLoggedInStudent(
    @Param('applicationId') applicationId: string,
    @GetUser('id') userId: string,
  ): Promise<CanadaVisaDto> {
    return await this.canadaVisaService.getVisaByApplicationIdForLoggedInStudent(
      userId,
      applicationId,
    );
  }

  @Patch('editRequiredVisaDocuments')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBody({ type: () => EditCanadaVisaDto })
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.Admin, Role.Visa)
  async editRequiredVisaDocuments(
    @Body() editCanadaVisaDto: EditCanadaVisaDto,
    @GetUser() user: EmployeeUserDto,
  ): Promise<void> {
    return await this.canadaVisaService.editRequiredVisaDocuments(
      editCanadaVisaDto,
      user,
    );
  }

  @Patch('editVisaApplicationAndBiometricFeeAmount')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBody({ type: () => EditCanadaVisaDto })
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.Admin, Role.Visa)
  async editVisaApplicationAndBiometricFeeAmount(
    @Body() editCanadaVisaDto: EditCanadaVisaDto,
    @GetUser() user: EmployeeUserDto,
  ): Promise<void> {
    return await this.canadaVisaService.editVisaApplicationAndBiometricFeeAmount(
      editCanadaVisaDto,
      user,
    );
  }

  @Patch('editVisaApplicationAndBiometricFeePaymentStatus')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBody({ type: () => EditCanadaVisaDto })
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.Admin, Role.Visa)
  async editVisaApplicationAndBiometricFeePaymentStatus(
    @Body() editCanadaVisaDto: EditCanadaVisaDto,
    @GetUser() user: EmployeeUserDto,
  ): Promise<void> {
    return await this.canadaVisaService.editVisaApplicationAndBiometricFeePaymentStatus(
      editCanadaVisaDto,
      user,
    );
  }

  @Patch('editBiometricSubmissionDate')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBody({ type: () => EditCanadaVisaDto })
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.Admin, Role.Visa)
  async editBiometricSubmissionDate(
    @Body() editCanadaVisaDto: EditCanadaVisaDto,
    @GetUser() user: EmployeeUserDto,
  ): Promise<void> {
    return await this.canadaVisaService.editBiometricSubmissionDate(
      editCanadaVisaDto,
      user,
    );
  }

  @Patch('editServiceFeeDepositPaymentStatus')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBody({ type: () => EditCanadaVisaDto })
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.Admin, Role.Visa)
  async editServiceFeeDepositPaymentStatus(
    @Body() editCanadaVisaDto: EditCanadaVisaDto,
    @GetUser() user: EmployeeUserDto,
  ): Promise<void> {
    return await this.canadaVisaService.editServiceFeeDepositPaymentStatus(
      editCanadaVisaDto,
      user,
    );
  }

  @Patch('editVisaConfirmationFiles/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        applicationConfirmation: {
          type: 'string',
          format: 'binary',
        },
        paymentConfirmation: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.Admin, Role.Visa)
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'applicationConfirmation', maxCount: 1 },
      { name: 'paymentConfirmation', maxCount: 1 },
    ]),
  )
  async editVisaConfirmationFiles(
    @UploadedFiles()
    files: {
      applicationConfirmation?: Express.Multer.File[];
      paymentConfirmation?: Express.Multer.File[];
    },
    @Param('id') id: string,
    @GetUser() user: EmployeeUserDto,
  ): Promise<void> {
    try {
      if (!(await this.canadaVisaService.visaExists(id)))
        throw new NotFoundException(`Visa with ID ${id} not found.`);

      if (!files.applicationConfirmation || !files.paymentConfirmation)
        throw new BadRequestException(
          'Both application confirmation and payment confirmation files are required.',
        );

      if (
        files.applicationConfirmation[0].mimetype !== 'application/pdf' ||
        files.paymentConfirmation[0].mimetype !== 'application/pdf'
      )
        throw new BadRequestException('Both files must be in PDF format.');

      const maxFileSize = 4 * 1024 * 1024; // 4 MB
      if (
        files.applicationConfirmation[0].size > maxFileSize ||
        files.paymentConfirmation[0].size > maxFileSize
      ) {
        throw new BadRequestException('File size exceeds the limit of 4 MB');
      }

      const visaApplicationStatus =
        await this.canadaVisaService.getVisaApplicationStatusById(id);

      if (
        visaApplicationStatus ==
        CanadaVisaApplicationStatus.DepositPaymentComplete
      ) {
        const identifier = `${id}-canada-visa`;
        const applicationFilename = await this.fileService.uploadFile(
          files.applicationConfirmation[0],
          identifier + '-application-confirmation',
        );
        const paymentFilename = await this.fileService.uploadFile(
          files.paymentConfirmation[0],
          identifier + '-payment-confirmation',
        );
        await this.canadaVisaService.editVisaConfirmationFiles(
          id,
          applicationFilename,
          paymentFilename,
          user,
        );
      } else
        throw new BadRequestException(
          `Visa status in: ${visaApplicationStatus}`,
        );
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      if (error instanceof NotFoundException) throw error;
      throw new BadRequestException({ error: error.message });
    }
  }

  @Patch('mobile/confirmationReceived')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBody({ type: () => EditCanadaVisaDto })
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.Student)
  async editConfirmationReceivedStatus(
    @Body() editCanadaVisaDto: EditCanadaVisaDto,
    @GetUser('id') userId: string,
  ): Promise<void> {
    return await this.canadaVisaService.editConfirmationReceivedStatus(
      userId,
      editCanadaVisaDto,
    );
  }

  @Patch('visaStatus')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBody({ type: () => EditCanadaVisaDto })
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.Admin, Role.Visa)
  async editVisaStatus(
    @Body() editCanadaVisaDto: EditCanadaVisaDto,
    @GetUser() user: EmployeeUserDto,
  ): Promise<void> {
    return await this.canadaVisaService.editVisaStatus(editCanadaVisaDto, user);
  }
}
