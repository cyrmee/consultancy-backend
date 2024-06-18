import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../auth/decorator';
import { JwtGuard, RolesGuard } from '../auth/guard';
import { AuditService } from './audit.service';
import { AuditDto } from './dto';

@ApiBearerAuth()
@ApiTags('audit')
@UseGuards(JwtGuard, RolesGuard)
@Roles(Role.Admin, Role.Agent, Role.Admission, Role.Finance, Role.Visa)
@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get(':recordId')
  async getAuditByRecordId(
    @Param('recordId') recordId: string,
  ): Promise<AuditDto[]> {
    return await this.auditService.getAuditByRecordId(recordId);
  }
}
