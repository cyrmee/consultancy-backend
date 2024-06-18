import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { EducationBackgroundService } from './education-background.service';
import {
  CreateEducationBackgroundDto,
  EditEducationBackgroundDto,
  EducationBackgroundDto,
} from './dto';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../auth/decorator';
import { JwtGuard, RolesGuard } from '../auth/guard';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { FileService } from '../common/files.service';

@ApiBearerAuth()
@ApiTags('education-background')
@UseGuards(JwtGuard, RolesGuard)
@Roles(Role.Admin, Role.Agent)
@Controller('education-background')
export class EducationBackgroundController {
  constructor(
    private readonly educationBackgroundService: EducationBackgroundService,
    private readonly fileService: FileService,
  ) {}

  @Get('student/:studentId')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.Admin, Role.Agent, Role.Admission, Role.Visa)
  async getEducationBackgrounds(
    @Param('studentId') studentId: string,
  ): Promise<EducationBackgroundDto[]> {
    return await this.educationBackgroundService.getEducationBackgrounds(
      studentId,
    );
  }

  @Get(':educationBackgroundId')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.Admin, Role.Agent, Role.Admission, Role.Visa)
  async getEducationBackgroundById(
    @Param('educationBackgroundId') educationBackgroundId: string,
  ): Promise<EducationBackgroundDto> {
    return await this.educationBackgroundService.getEducationBackgroundById(
      educationBackgroundId,
    );
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiBody({ type: () => CreateEducationBackgroundDto })
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.Admin, Role.Agent)
  async createEducationBackground(
    @Body() createEducationBackgroundDto: CreateEducationBackgroundDto,
  ): Promise<void> {
    await this.educationBackgroundService.createEducationBackground(
      createEducationBackgroundDto,
    );
  }

  @Patch('certificate/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        certificate: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(
    FileFieldsInterceptor([{ name: 'certificate', maxCount: 1 }]),
  )
  async editEducationBackgroundCertificate(
    @UploadedFiles()
    files: {
      certificate: Express.Multer.File[];
    },
    @Param('id') id: string,
  ): Promise<void> {
    try {
      if (!files.certificate) throw new BadRequestException('File is missing');

      if (files.certificate[0].mimetype !== 'application/pdf') {
        throw new BadRequestException('Only PDF files are allowed.');
      }

      const maxFileSize = 4 * 1024 * 1024; // 4 MB
      if (files.certificate[0].size > maxFileSize)
        throw new BadRequestException('File size exceeds the limit of 4 MB');

      const identifier = `${id}-education-certificate`;
      const certificateFilename = await this.fileService.uploadFile(
        files.certificate[0],
        identifier,
      );

      await this.educationBackgroundService.editEducationBackgroundCertificate(
        id,
        certificateFilename,
      );
    } catch (error) {
      throw new BadRequestException({ error: error.message });
    }
  }

  @Patch('transcript/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        transcript: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(FileFieldsInterceptor([{ name: 'transcript', maxCount: 1 }]))
  async editEducationBackgroundTranscript(
    @UploadedFiles()
    files: {
      transcript: Express.Multer.File[];
    },
    @Param('id') id: string,
  ): Promise<void> {
    try {
      if (!files.transcript) throw new BadRequestException('File is missing');

      if (files.transcript[0].mimetype !== 'application/pdf') {
        throw new BadRequestException('Only PDF files are allowed.');
      }

      const maxFileSize = 4 * 1024 * 1024; // 4 MB
      if (files.transcript[0].size > maxFileSize)
        throw new BadRequestException('File size exceeds the limit of 4 MB');

      const identifier = `${id}-education-transcript`;
      const transcriptFilename = await this.fileService.uploadFile(
        files.transcript[0],
        identifier,
      );

      await this.educationBackgroundService.editEducationBackgroundTranscript(
        id,
        transcriptFilename,
      );
    } catch (error) {
      throw new BadRequestException({ error: error.message });
    }
  }

  @Patch()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBody({ type: () => EditEducationBackgroundDto })
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.Admin, Role.Agent)
  async editEducationBackground(
    @Body() editEducationBackgroundDto: EditEducationBackgroundDto,
  ): Promise<void> {
    await this.educationBackgroundService.editEducationBackground(
      editEducationBackgroundDto,
    );
  }

  @Delete(':educationBackgroundId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.Admin, Role.Agent)
  async deleteEducationBackground(
    @Param('educationBackgroundId') educationBackgroundId: string,
  ): Promise<void> {
    await this.educationBackgroundService.deleteEducationBackground(
      educationBackgroundId,
    );
  }
}
