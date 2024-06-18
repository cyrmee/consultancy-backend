import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CommentService } from './comment.service';
import { ApiBearerAuth, ApiBody, ApiTags } from '@nestjs/swagger';
import { JwtGuard, RolesGuard } from '../auth/guard';
import { GetUser, Roles } from '../auth/decorator';
import { Role } from '@prisma/client';
import { CommentDto, CreateCommentDto, EditCommentDto } from './dto';
import { EmployeeUserDto } from '../auth/dto';

@ApiBearerAuth()
@ApiTags('comment')
@UseGuards(JwtGuard, RolesGuard)
@Roles(Role.Admin, Role.Agent, Role.Admission, Role.Finance, Role.Visa)
@Controller('comment')
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @Get('recent-comments')
  async getRecentCommentsByEmployee(
    @GetUser() user: EmployeeUserDto,
  ): Promise<CommentDto[]> {
    return await this.commentService.getRecentCommentsByEmployee(user);
  }

  @Get('application/:applicationId')
  async getAllCommentsByApplicationId(
    @Param('applicationId') applicationId: string,
  ): Promise<CommentDto[]> {
    return await this.commentService.getAllCommentsByApplicationId(
      applicationId,
    );
  }

  @Get(':id')
  async getCommentById(@Param('id') commentId: string): Promise<CommentDto> {
    return await this.commentService.getCommentById(commentId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiBody({ type: () => CreateCommentDto })
  async createComment(
    @Body() createCommentDto: CreateCommentDto,
    @GetUser('id') userId: string,
  ): Promise<void> {
    return this.commentService.createComment(createCommentDto, userId);
  }

  @Patch()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBody({ type: () => EditCommentDto })
  async editComment(
    @Body() editCommentDto: EditCommentDto,
    @GetUser('id') userId: string,
  ): Promise<void> {
    return this.commentService.editComment(editCommentDto, userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteComment(
    @Param('id') commentId: string,
    @GetUser('id') userId: string,
  ): Promise<void> {
    return this.commentService.deleteComment(commentId, userId);
  }
}
