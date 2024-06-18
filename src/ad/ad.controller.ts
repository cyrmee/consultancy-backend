import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { AdService } from './ad.service';
import { FileService } from '../common/files.service';
import { Role } from '@prisma/client';
import { Roles } from '../auth/decorator';
import { JwtGuard, RolesGuard } from '../auth/guard';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { AdDto } from './dto';

@ApiBearerAuth()
@ApiTags('content')
@Controller('content')
export class AdController {
  constructor(
    private readonly adService: AdService,
    private readonly fileService: FileService,
  ) {}

  @Get()
  async getContents(): Promise<AdDto[]> {
    return await this.adService.getAds();
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        image: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.Admin)
  @UseInterceptors(FileFieldsInterceptor([{ name: 'image', maxCount: 1 }]))
  async createContent(
    @UploadedFiles()
    files: {
      image: Express.Multer.File[];
    },
  ): Promise<void> {
    try {
      if (!files.image) throw new BadRequestException('File is missing');

      if (
        files.image[0].mimetype !== 'image/jpeg' &&
        files.image[0].mimetype !== 'image/png' &&
        files.image[0].mimetype !== 'image/gif'
      ) {
        throw new BadRequestException('Only image files are allowed.');
      }

      const maxFileSize = 2 * 1024 * 1024; // 2 MB
      if (files.image[0].size > maxFileSize)
        throw new BadRequestException('File size exceeds the limit of 2 MB');

      const filename = await this.fileService.uploadFile(files.image[0], 'ad');
      await this.adService.createAd(filename);
    } catch (error) {
      throw new BadRequestException({ error: error.message });
    }
  }

  @Delete(':id')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.Admin)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteContent(@Param('id') id: string): Promise<void> {
    await this.adService.deleteAd(id);
  }
}
