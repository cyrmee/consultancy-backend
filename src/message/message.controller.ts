import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { GetUser, Roles } from '../auth/decorator';
import { JwtGuard, RolesGuard } from '../auth/guard';
import { MessageService } from './message.service';
import { MessageDto } from './dto';

@ApiBearerAuth()
@UseGuards(JwtGuard, RolesGuard)
@Roles(Role.Admin, Role.Agent, Role.Student)
@ApiTags('message')
@Controller('message')
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

  @Get(':id')
  async getMessageById(
    @GetUser('id') userId: string,
    @Param('id') messageId: string,
  ): Promise<MessageDto> {
    return await this.messageService.getMessageById(userId, messageId);
  }
}
