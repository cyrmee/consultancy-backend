import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  AdditionalStudentFilesDto,
  CreateAdditionalStudentFilesDto,
  EditAdditionalStudentFilesDto,
} from './dto';
import { plainToInstance } from 'class-transformer';
import { FileService } from '../common/files.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AdditionalStudentFilesService {
  constructor(
    private readonly database: PrismaService,
    private readonly fileService: FileService,
    private readonly config: ConfigService,
  ) {}

  async additionalStudentFileExists(id: string): Promise<boolean> {
    return (await this.database.additionalStudentFiles.findUnique({
      where: { id: id },
    }))
      ? true
      : false;
  }

  async getAdditionalStudentFile(
    id: string,
  ): Promise<AdditionalStudentFilesDto> {
    try {
      const additionalStudentFiles =
        await this.database.additionalStudentFiles.findUnique({
          where: { id: id },
        });

      if (!additionalStudentFiles) {
        throw new NotFoundException(
          `Additional student files with ID ${id} not found.`,
        );
      }

      return plainToInstance(
        AdditionalStudentFilesDto,
        additionalStudentFiles,
        {
          excludeExtraneousValues: true,
        },
      );
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async getAdditionalStudentFiles(): Promise<AdditionalStudentFilesDto[]> {
    try {
      const additionalStudentFiles =
        await this.database.additionalStudentFiles.findMany({
          orderBy: { updatedAt: 'desc' },
        });

      return plainToInstance(
        AdditionalStudentFilesDto,
        additionalStudentFiles,
        {
          excludeExtraneousValues: true,
        },
      );
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async createAdditionalStudentFile(
    createAdditionalStudentFilesDto: CreateAdditionalStudentFilesDto,
  ): Promise<void> {
    try {
      await this.database.additionalStudentFiles.create({
        data: {
          fileType: createAdditionalStudentFilesDto.fileType,
          fileUri: createAdditionalStudentFilesDto.fileUri,
          student: {
            connect: {
              id: createAdditionalStudentFilesDto.studentId,
            },
          },
        },
      });
    } catch (error) {
      console.error(error);
      if (error.code === 'P2002')
        throw new BadRequestException(`${error.meta.target} already exists`);
      else if (error.code === 'P2025')
        throw new BadRequestException(`${error.meta.cause}`);
      throw error;
    }
  }

  async editAdditionalStudentFile(
    editAdditionalStudentFilesDto: EditAdditionalStudentFilesDto,
  ): Promise<void> {
    try {
      const additionalStudentFiles =
        await this.database.additionalStudentFiles.findUnique({
          where: {
            id: editAdditionalStudentFilesDto.id,
          },
        });

      if (additionalStudentFiles.fileUri) {
        await this.fileService.deleteFileAsync(
          editAdditionalStudentFilesDto.fileType,
        );
      }

      await this.database.additionalStudentFiles.update({
        where: { id: editAdditionalStudentFilesDto.id },
        data: {
          fileType: editAdditionalStudentFilesDto.fileType,
          fileUri: editAdditionalStudentFilesDto.fileUri,
          updatedAt: new Date(Date.now()),
        },
      });
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async deleteAdditionalStudentFile(id: string): Promise<void> {
    try {
      const additionalStudentFile =
        await this.database.additionalStudentFiles.findUnique({
          where: { id: id },
        });

      if (!additionalStudentFile) {
        throw new NotFoundException(
          `Additional student file with ID ${id} not found.`,
        );
      }

      if (
        additionalStudentFile.fileUri &&
        (await this.fileService.fileExistsAsync(additionalStudentFile.fileUri))
      )
        await this.fileService.deleteFileAsync(additionalStudentFile.fileUri);

      await this.database.additionalStudentFiles.delete({
        where: { id: id },
      });
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
}
