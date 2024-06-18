import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditDto, CreateAuditDto } from './dto';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class AuditService {
  constructor(private readonly database: PrismaService) {}

  async createAudit(createAuditDto: CreateAuditDto): Promise<void> {
    try {
      await this.database.audit.create({
        data: {
          entity: createAuditDto.entity,
          recordId: createAuditDto.recordId,
          operation: createAuditDto.operation,
          previousValues: createAuditDto.previousValues,
          detail: createAuditDto.detail,
          user: {
            connect: {
              id: createAuditDto.userId,
            },
          },
        },
      });
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async getAuditByRecordId(recordId: string): Promise<AuditDto[]> {
    try {
      const audits = await this.database.audit.findMany({
        where: { recordId: recordId },
        include: { user: true },
        orderBy: { createdAt: 'desc' },
      });

      return plainToInstance(AuditDto, audits, {
        excludeExtraneousValues: true,
      });
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
}
