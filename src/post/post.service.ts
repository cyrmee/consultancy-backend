import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePostDto, EditPostDto, PostDto } from './dto';
import { plainToInstance } from 'class-transformer';
import { FileService } from '../common/files.service';
import { ConversationType, Role } from '@prisma/client';

@Injectable()
export class PostService {
  constructor(
    private readonly database: PrismaService,
    private readonly fileService: FileService,
  ) {}

  async postExists(postId: string): Promise<boolean> {
    return (await this.database.post.findUnique({
      where: { id: postId },
    }))
      ? true
      : false;
  }

  async getPosts(): Promise<PostDto[]> {
    try {
      const posts = await this.database.post.findMany({
        orderBy: { updatedAt: 'desc' },
      });

      return plainToInstance(PostDto, posts, {
        excludeExtraneousValues: true,
      });
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async getPost(id: string): Promise<PostDto> {
    try {
      const post = await this.database.post.findUnique({
        where: { id: id },
      });

      if (!post) {
        throw new NotFoundException(`Post with ID ${id} not found.`);
      }

      return plainToInstance(PostDto, post, {
        excludeExtraneousValues: true,
      });
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async createPost(createPostDto: CreatePostDto): Promise<void> {
    try {
      await this.database.$transaction(async () => {
        await this.database.post.create({
          data: {
            title: createPostDto.title,
            description: createPostDto.description,
            image: createPostDto.image,
            videoLink: createPostDto.videoLink,
          },
        });

        const users = await this.database.user.findMany({
          where: {
            roles: {
              hasSome: [Role.Admin, Role.Student],
            },
          },
          select: {
            id: true,
          },
        });

        await this.database.conversation.create({
          data: {
            title: createPostDto.title,
            type: ConversationType.Forum,
            participants: {
              connect: users.map((student) => ({ id: student.id })),
            },
          },
        });
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

  async editPost(editPostDto: EditPostDto): Promise<void> {
    try {
      const post = await this.database.post.findUnique({
        where: {
          id: editPostDto.id,
        },
      });

      if (post.image) {
        await this.fileService.deleteFileAsync(editPostDto.image);
      }

      await this.database.post.update({
        where: { id: editPostDto.id },
        data: {
          title: editPostDto.title,
          description: editPostDto.description,
          image: editPostDto.image,
          videoLink: editPostDto.videoLink,
          updatedAt: new Date(Date.now()),
        },
      });
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async deletePost(id: string): Promise<void> {
    try {
      const post = await this.database.post.findUnique({
        where: { id: id },
      });

      if (!post) {
        throw new NotFoundException(`Post with ID ${id} not found.`);
      }

      if (post.image && (await this.fileService.fileExistsAsync(post.image)))
        await this.fileService.deleteFileAsync(post.image);

      await this.database.post.delete({
        where: { id: id },
      });
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
}
