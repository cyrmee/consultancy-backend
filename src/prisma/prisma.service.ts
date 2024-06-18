import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient {
  constructor(config: ConfigService) {
    try {
      super({
        datasources: {
          db: {
            url: config.get('DATABASE_URL'),
          },
        },
      });
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async cleanDb(): Promise<void> {
    await this.$transaction([
      // this.student.deleteMany(),
      // this.employee.deleteMany(),
    ]);
  }
}
