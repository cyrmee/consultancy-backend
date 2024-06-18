import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ConversationService } from './conversation.service';
import {
  ConversationDto,
  ConversationWithoutMessagesDto,
  ForumConversationDto,
  UserDto,
} from './dto';
import { Role } from '@prisma/client';
import { GetUser, Roles } from '../auth/decorator';
import { JwtGuard, RolesGuard } from '../auth/guard';

@ApiBearerAuth()
@UseGuards(JwtGuard, RolesGuard)
@Roles(
  Role.Admin,
  Role.Agent,
  Role.Admission,
  Role.Finance,
  Role.Visa,
  Role.Student,
)
@ApiTags('conversation')
@Controller('conversation')
export class ConversationController {
  constructor(private readonly conversationService: ConversationService) {}

  @Get()
  async getConversations(
    @GetUser('id') userId: string,
  ): Promise<ConversationWithoutMessagesDto[]> {
    return await this.conversationService.getConversations(userId);
  }

  @Get('forum')
  async getForums(
    @GetUser('id') userId: string,
  ): Promise<ConversationWithoutMessagesDto[]> {
    const forums = await this.conversationService.getForums(userId);
    return forums;
  }

  @Get('details/:id')
  async getConversationById(
    @Param('id') id: string,
    @GetUser('id') userId: string,
  ): Promise<ConversationDto> {
    return await this.conversationService.getConversationById(id, userId);
  }

  @Get('forum/:id')
  async getForumById(
    @Param('id') id: string,
    @GetUser('id') userId: string,
  ): Promise<ForumConversationDto> {
    return await this.conversationService.getForumById(id, userId);
  }

  @Get('employees')
  async getEmployeesForChat(@GetUser('id') userId: string): Promise<UserDto[]> {
    return await this.conversationService.getEmployeesForChat(userId);
  }

  @Post('employees/:recipientId')
  @HttpCode(HttpStatus.CREATED)
  async createEmployeeConversation(
    @Param('recipientId') recipientId: string,
    @GetUser('id') senderId: string,
  ): Promise<void> {
    return await this.conversationService.createEmployeeConversation(
      recipientId,
      senderId,
    );
  }
}
