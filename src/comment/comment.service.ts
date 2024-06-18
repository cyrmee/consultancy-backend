import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CommentDto, CreateCommentDto, EditCommentDto } from './dto';
import { plainToInstance } from 'class-transformer';
import { EmployeeUserDto } from '../auth/dto';
import { Role } from '@prisma/client';

@Injectable()
export class CommentService {
  constructor(private readonly database: PrismaService) {}

  async getRecentCommentsByEmployee(
    user: EmployeeUserDto,
  ): Promise<CommentDto[]> {
    try {
      let comments = [];
      if (user.roles.includes(Role.Admin))
        comments = await this.database.comment.findMany({
          where: {
            parent: null,
          },
          include: {
            user: {
              include: {
                employee: true,
              },
            },
            application: {
              include: {
                student: true,
              },
            },
            parent: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        });
      else
        comments = await this.database.comment.findMany({
          where: {
            application: {
              OR: [
                { financeId: user.employee.id },
                { admissionId: user.employee.id },
                { visaId: user.employee.id },
                {
                  student: {
                    agentId: user.employee.id,
                  },
                },
              ],
            },
            parent: null,
          },
          include: {
            user: {
              include: {
                employee: true,
              },
            },
            application: {
              include: {
                student: true,
              },
            },
            parent: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 5,
        });

      return plainToInstance(CommentDto, comments, {
        excludeExtraneousValues: true,
      });
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async getAllCommentsByApplicationId(
    applicationId: string,
  ): Promise<CommentDto[]> {
    try {
      const application = await this.database.application.findUnique({
        where: { id: applicationId },
      });

      if (!application)
        throw new NotFoundException(
          `Application with ID ${applicationId} not found.`,
        );

      const comments = await this.database.comment.findMany({
        where: {
          applicationId: applicationId,
        },
        include: {
          user: {
            include: {
              employee: true,
            },
          },
          parent: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      return plainToInstance(CommentDto, comments, {
        excludeExtraneousValues: true,
      });
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async getCommentById(commentId: string): Promise<CommentDto> {
    try {
      const comment = await this.database.comment.findUnique({
        where: { id: commentId, isDeleted: false },
        include: {
          user: {
            include: {
              employee: true,
            },
          },
          parent: true,
        },
      });

      if (!comment) {
        throw new NotFoundException(`Comment with ID ${commentId} not found.`);
      }

      return plainToInstance(CommentDto, comment, {
        excludeExtraneousValues: true,
      });
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async createComment(
    createCommentDto: CreateCommentDto,
    userId: string,
  ): Promise<void> {
    try {
      if (createCommentDto.parentId) {
        const parentComment = await this.database.comment.findUnique({
          where: {
            id: createCommentDto.parentId,
          },
        });

        if (!parentComment)
          throw new BadRequestException(
            `Parent comment with ID ${createCommentDto.parentId} not found.`,
          );
      }

      await this.database.comment.create({
        data: {
          text: createCommentDto.text,
          application: {
            connect: {
              id: createCommentDto.applicationId,
            },
          },
          user: {
            connect: {
              id: userId,
            },
          },
          parent: createCommentDto.parentId
            ? {
                connect: { id: createCommentDto.parentId },
              }
            : undefined,
        },
      });
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async editComment(
    editCommentDto: EditCommentDto,
    userId: string,
  ): Promise<void> {
    try {
      const existingComment = await this.getCommentById(editCommentDto.id);

      if (!existingComment)
        throw new NotFoundException(
          `Comment with ID ${editCommentDto.id} not found.`,
        );

      if (existingComment.user.id !== userId)
        throw new BadRequestException(`You can only edit your comment.`);

      if (editCommentDto.parentId) {
        const parentComment = await this.database.comment.findUnique({
          where: {
            id: editCommentDto.parentId,
          },
        });

        if (!parentComment)
          throw new BadRequestException(
            `Parent comment with ID ${editCommentDto.parentId} not found.`,
          );
      }

      await this.database.comment.update({
        where: { id: editCommentDto.id },
        data: {
          text: editCommentDto.text,
          parent: editCommentDto.parentId
            ? {
                connect: { id: editCommentDto.parentId },
              }
            : undefined,
          updatedAt: new Date(Date.now()),
          isEdited: true,
        },
      });
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async deleteComment(commentId: string, userId: string): Promise<void> {
    try {
      const existingComment = await this.getCommentById(commentId);

      if (!existingComment)
        throw new NotFoundException(`Comment with ID ${commentId} not found.`);

      if (existingComment.user.id !== userId)
        throw new BadRequestException(`You can only delete your comment.`);

      await this.database.comment.delete({
        where: { id: commentId },
      });
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
}
