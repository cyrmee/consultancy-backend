import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { plainToInstance } from 'class-transformer';
import {
  CreateEducationBackgroundDto,
  EditEducationBackgroundDto,
  EducationBackgroundDto,
} from './dto';
import { FileService } from '../common/files.service';

@Injectable()
export class EducationBackgroundService {
  constructor(
    private readonly database: PrismaService,
    private readonly fileService: FileService,
  ) {}

  async getEducationBackgrounds(
    studentId: string,
  ): Promise<EducationBackgroundDto[]> {
    try {
      const student = await this.database.student.findUnique({
        where: { id: studentId },
        include: {
          educationBackgrounds: true,
        },
      });

      if (!student)
        throw new NotFoundException(`Student with ID ${studentId} not found.`);

      return plainToInstance(
        EducationBackgroundDto,
        student.educationBackgrounds,
        {
          excludeExtraneousValues: true,
        },
      );
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async getEducationBackgroundById(
    educationBackgroundId: string,
  ): Promise<EducationBackgroundDto> {
    try {
      const educationBackground =
        await this.database.educationBackground.findUnique({
          where: { id: educationBackgroundId },
        });

      if (!educationBackground)
        throw new NotFoundException(
          `Education background with ID ${educationBackgroundId} not found.`,
        );

      return plainToInstance(EducationBackgroundDto, educationBackground, {
        excludeExtraneousValues: true,
      });
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async createEducationBackground(
    createEducationBackgroundDto: CreateEducationBackgroundDto,
  ): Promise<void> {
    try {
      const student = await this.database.student.findUnique({
        where: {
          id: createEducationBackgroundDto.studentId,
        },
      });

      if (!student)
        throw new NotFoundException(
          `Student with ID ${createEducationBackgroundDto.studentId} not found.`,
        );

      await this.database.educationBackground.create({
        data: {
          institution: createEducationBackgroundDto.institution,
          degree: createEducationBackgroundDto.degree,
          fieldOfStudy: createEducationBackgroundDto.fieldOfStudy,
          startDate: createEducationBackgroundDto.startDate,
          endDate: createEducationBackgroundDto.endDate,
          gpa: createEducationBackgroundDto.gpa,
          rank: createEducationBackgroundDto.rank,
          student: {
            connect: {
              id: createEducationBackgroundDto.studentId,
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

  async editEducationBackground(
    editEducationBackgroundDto: EditEducationBackgroundDto,
  ): Promise<void> {
    try {
      const studentEducationBackground =
        await this.database.educationBackground.findUnique({
          where: { id: editEducationBackgroundDto.id },
        });

      if (!studentEducationBackground)
        throw new NotFoundException(
          `Education background with ID ${editEducationBackgroundDto.id} not found.`,
        );

      await this.database.educationBackground.update({
        where: { id: editEducationBackgroundDto.id },
        data: {
          institution: editEducationBackgroundDto.institution,
          degree: editEducationBackgroundDto.degree,
          fieldOfStudy: editEducationBackgroundDto.fieldOfStudy,
          startDate: editEducationBackgroundDto.startDate,
          endDate: editEducationBackgroundDto.endDate,
          gpa: editEducationBackgroundDto.gpa,
          rank: editEducationBackgroundDto.rank,
          updatedAt: new Date(Date.now()),
        },
      });
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async editEducationBackgroundCertificate(
    id: string,
    certificateFilename: string,
  ): Promise<void> {
    try {
      const educationBackground =
        await this.database.educationBackground.findUnique({
          where: { id: id },
        });

      if (!educationBackground)
        throw new NotFoundException(
          `Education background with ID ${id} not found.`,
        );

      if (educationBackground.certificateFileUri)
        await this.fileService.deleteFileAsync(
          educationBackground.certificateFileUri,
        );

      await this.database.educationBackground.update({
        where: { id: id },
        data: {
          certificateFileUri: certificateFilename,
          updatedAt: new Date(Date.now()),
        },
      });
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async editEducationBackgroundTranscript(
    id: string,
    transcriptFilename: string,
  ): Promise<void> {
    try {
      const educationBackground =
        await this.database.educationBackground.findUnique({
          where: { id: id },
        });

      if (!educationBackground)
        throw new NotFoundException(
          `Education background with ID ${id} not found.`,
        );

      if (educationBackground.transcriptFileUri)
        await this.fileService.deleteFileAsync(
          educationBackground.transcriptFileUri,
        );

      await this.database.educationBackground.update({
        where: { id: id },
        data: {
          transcriptFileUri: transcriptFilename,
          updatedAt: new Date(Date.now()),
        },
      });
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async deleteEducationBackground(
    educationBackgroundId: string,
  ): Promise<void> {
    try {
      const educationBackground =
        await this.database.educationBackground.findUnique({
          where: { id: educationBackgroundId },
        });

      if (!educationBackground)
        throw new NotFoundException(
          `Education background with ID ${educationBackgroundId} not found.`,
        );

      if (educationBackground.certificateFileUri)
        await this.fileService.deleteFileAsync(
          educationBackground.certificateFileUri,
        );

      if (educationBackground.transcriptFileUri)
        await this.fileService.deleteFileAsync(
          educationBackground.transcriptFileUri,
        );

      await this.database.educationBackground.delete({
        where: { id: educationBackgroundId },
      });
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
}
