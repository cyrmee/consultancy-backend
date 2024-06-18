import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AdDto } from './dto';
import { plainToInstance } from 'class-transformer';
import { FileService } from '../common/files.service';

@Injectable()
export class AdService {
  constructor(
    private readonly database: PrismaService,
    private readonly fileService: FileService,
  ) {}

  async getAds(): Promise<AdDto[]> {
    try {
      const ads = await this.database.ad.findMany({
        orderBy: { updatedAt: 'desc' },
      });

      return plainToInstance(AdDto, ads, { excludeExtraneousValues: true });
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async createAd(filename: string): Promise<void> {
    try {
      await this.database.ad.create({
        data: {
          image: filename,
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

  async deleteAd(id: string): Promise<void> {
    try {
      const ad = await this.database.ad.findUnique({
        where: { id: id },
      });

      if (!ad) throw new NotFoundException(`Ad with ID ${id} not found`);

      if (ad.image && (await this.fileService.fileExistsAsync(ad.image)))
        await this.fileService.deleteFileAsync(ad.image);

      await this.database.ad.delete({
        where: { id: id },
      });
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
}
