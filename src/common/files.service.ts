import {
  DeleteObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { extname } from 'path';

@Injectable()
export class FileService {
  constructor(private readonly config: ConfigService) {}

  s3 = new S3Client({
    region: this.config.get('AWS_REGION'),
    credentials: {
      accessKeyId: this.config.get('AWS_ACCESS_KEY_ID'),
      secretAccessKey: this.config.get('AWS_SECRET_ACCESS_KEY'),
    },
  });

  async uploadFile(
    file: Express.Multer.File,
    identifier: string = '',
  ): Promise<string> {
    const filename = await this.generateFileName(identifier, file);

    // production key - uploads to a different folder
    const key = `${this.config.get('AWS_FOLDER_NAME')}/${filename}`;

    const params = {
      Bucket: this.config.get('AWS_BUCKET_NAME'),
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    };

    await this.s3.send(new PutObjectCommand(params));
    return key;
  }

  async generateFileName(
    identifier: string,
    file: Express.Multer.File,
  ): Promise<string> {
    const currentDate = new Date()
      .toISOString()
      .replace(/:/g, '-')
      .replace(/\./g, '-');
    const randomName = Array(20)
      .fill(null)
      .map(() => Math.round(Math.random() * 20).toString(20))
      .join('');
    const filename = `${currentDate}-${identifier}-${randomName}${extname(
      file.originalname,
    )}`;

    return filename;
  }

  async fileExistsAsync(key: string): Promise<boolean> {
    try {
      await this.s3.send(
        new HeadObjectCommand({
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: key,
        }),
      );
      return true;
    } catch (error) {
      console.error(error);
      if (error.name === 'NotFound') {
        return false;
      }
      throw error;
    }
  }

  async deleteFileAsync(key: string): Promise<boolean> {
    try {
      await this.s3.send(
        new DeleteObjectCommand({
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: key,
        }),
      );
      console.log(`File deleted successfully: ${key}`);
      return true;
    } catch (error) {
      console.error(error);
      if (error.name === 'NotFound') {
        console.error(`File not found: ${key}`);
      } else {
        console.error(`Error deleting file: ${error.message}`);
      }
      console.error('Failed to delete the file');
    }
  }

  // async fileExistsAsync(filePath: string): Promise<boolean> {
  //   try {
  //     await fs.promises.stat(filePath);
  //     return true;
  //   } catch (error) {
  // console.log(error);
  //     if (error.code === 'ENOENT') {
  //       return false;
  //     }
  //     throw error;
  //   }
  // }

  // async deleteFileAsync(filePath: string): Promise<boolean> {
  //   try {
  //     await fs.promises.unlink(filePath);
  //     console.log(`File deleted successfully: ${filePath}`);
  //     return true;
  //   } catch (error) {
  // console.log(error);
  //     if (error.code === 'ENOENT') {
  //       console.error(`File not found: ${filePath}`);
  //     } else {
  //       console.error(`Error deleting file: ${error.message}`);
  //     }
  //     throw new Error('Failed to delete the file');
  //   }
  // }
}
