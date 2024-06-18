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
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../auth/decorator';
import { JwtGuard, RolesGuard } from '../auth/guard';
import { FileService } from '../common/files.service';
import { AdditionalStudentFilesService } from './additional-student-files.service';
import {
  AdditionalStudentFilesDto,
  CreateAdditionalStudentFilesDto,
  EditAdditionalStudentFilesDto,
} from './dto';

@ApiBearerAuth()
@ApiTags('additional-student-files')
@UseGuards(JwtGuard, RolesGuard)
@Roles(Role.Admin, Role.Agent, Role.Admission, Role.Visa)
@Controller('additional-student-files')
export class AdditionalStudentFilesController {
  constructor(
    private readonly additionalStudentFilesService: AdditionalStudentFilesService,
    private readonly fileService: FileService,
  ) {}

  @Get()
  async getAdditionalStudentFiles(): Promise<AdditionalStudentFilesDto[]> {
    return await this.additionalStudentFilesService.getAdditionalStudentFiles();
  }

  @Get(':id')
  async getAdditionalStudentFile(
    @Param('id') id: string,
  ): Promise<AdditionalStudentFilesDto> {
    return await this.additionalStudentFilesService.getAdditionalStudentFile(
      id,
    );
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiBody({ type: () => CreateAdditionalStudentFilesDto })
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
  @Roles(Role.Admin, Role.Agent)
  @UseInterceptors(FileFieldsInterceptor([{ name: 'file', maxCount: 1 }]))
  async createAdditionalStudentFile(
    @UploadedFiles()
    files: {
      file: Express.Multer.File[];
    },
    @Body() createAdditionalStudentFilesDto: CreateAdditionalStudentFilesDto,
  ): Promise<void> {
    try {
      if (!files.file) throw new BadRequestException('File is missing');

      if (files.file[0].mimetype !== 'application/pdf') {
        throw new BadRequestException('Only PDF files are allowed.');
      }

      const maxFileSize = 2 * 1024 * 1024; // 2 MB
      if (files.file[0].size > maxFileSize)
        throw new BadRequestException('File size exceeds the limit of 2 MB');

      const filename = await this.fileService.uploadFile(
        files.file[0],
        'additionalStudentFile',
      );
      createAdditionalStudentFilesDto.fileUri = filename;

      await this.additionalStudentFilesService.createAdditionalStudentFile(
        createAdditionalStudentFilesDto,
      );
    } catch (error) {
      throw new BadRequestException({ error: error.message });
    }
  }

  @Patch()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBody({ type: () => EditAdditionalStudentFilesDto })
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
  @Roles(Role.Admin, Role.Agent)
  @UseInterceptors(FileFieldsInterceptor([{ name: 'file', maxCount: 1 }]))
  async editAdditionalStudentFile(
    @UploadedFiles()
    files: {
      file: Express.Multer.File[];
    },
    @Body() editAdditionalStudentFilesDto: EditAdditionalStudentFilesDto,
  ): Promise<void> {
    if (!files.file) throw new BadRequestException('File is missing');

    if (files.file[0].mimetype !== 'application/pdf') {
      throw new BadRequestException('Only PDF files are allowed.');
    }

    const maxFileSize = 2 * 1024 * 1024; // 2 MB
    if (files.file[0].size > maxFileSize)
      throw new BadRequestException('File size exceeds the limit of 2 MB');

    try {
      if (
        await this.additionalStudentFilesService.additionalStudentFileExists(
          editAdditionalStudentFilesDto.id,
        )
      ) {
        const identifier = `additionalStudentFile-${editAdditionalStudentFilesDto.id}`;
        const filename = await this.fileService.uploadFile(
          files.file[0],
          identifier,
        );

        editAdditionalStudentFilesDto.fileUri = filename;

        await this.additionalStudentFilesService.editAdditionalStudentFile(
          editAdditionalStudentFilesDto,
        );
      } else
        throw new NotFoundException(
          `No additional student file found with id ${editAdditionalStudentFilesDto.id}`,
        );
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new BadRequestException({ error: error.message });
    }
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.Admin, Role.Agent)
  async deletePost(@Param('id') id: string): Promise<void> {
    await this.additionalStudentFilesService.deleteAdditionalStudentFile(id);
  }
}
