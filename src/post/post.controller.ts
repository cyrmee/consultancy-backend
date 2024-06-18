import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Patch,
  Post,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../auth/decorator';
import { JwtGuard, RolesGuard } from '../auth/guard';
import { PostService } from './post.service';
import { CreatePostDto, EditPostDto, PostDto } from './dto';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { FileService } from '../common/files.service';

@ApiBearerAuth()
@ApiTags('post')
@Controller('post')
export class PostController {
  constructor(
    private readonly postService: PostService,
    private readonly fileService: FileService,
  ) {}

  @Get()
  async getPosts(): Promise<PostDto[]> {
    return await this.postService.getPosts();
  }

  @Get(':id')
  async getPost(@Param('id') id: string): Promise<PostDto> {
    return await this.postService.getPost(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiBody({ type: () => CreatePostDto })
  @ApiConsumes('multipart/form-data')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.Admin, Role.Agent, Role.Admission)
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        image: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(FileFieldsInterceptor([{ name: 'image', maxCount: 1 }]))
  async createPost(
    @UploadedFiles()
    files: {
      image: Express.Multer.File[];
    },
    @Body() createPostDto: CreatePostDto,
  ): Promise<void> {
    try {
      if (!files.image) throw new BadRequestException('File is missing');

      if (
        files.image[0].mimetype !== 'image/jpeg' &&
        files.image[0].mimetype !== 'image/png' &&
        files.image[0].mimetype !== 'image/gif'
      ) {
        throw new BadRequestException('Only image files are allowed.');
      }

      const maxFileSize = 2 * 1024 * 1024; // 2 MB
      if (files.image[0].size > maxFileSize)
        throw new BadRequestException('File size exceeds the limit of 2 MB');

      const filename = await this.fileService.uploadFile(
        files.image[0],
        'post',
      );
      createPostDto.image = filename;

      await this.postService.createPost(createPostDto);
    } catch (error) {
      throw new BadRequestException({ error: error.message });
    }
  }

  @Patch()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBody({ type: () => EditPostDto })
  @ApiConsumes('multipart/form-data')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.Admin, Role.Agent, Role.Admission)
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        image: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(FileFieldsInterceptor([{ name: 'image', maxCount: 1 }]))
  async editPost(
    @UploadedFiles()
    files: {
      image: Express.Multer.File[];
    },
    @Body() editPostDto: EditPostDto,
  ): Promise<void> {
    try {
      if (!files.image) throw new BadRequestException('File is missing');

      if (
        files.image[0].mimetype !== 'image/jpeg' &&
        files.image[0].mimetype !== 'image/png' &&
        files.image[0].mimetype !== 'image/gif'
      ) {
        throw new BadRequestException('Only image files are allowed.');
      }

      const maxFileSize = 2 * 1024 * 1024; // 2 MB
      if (files.image[0].size > maxFileSize)
        throw new BadRequestException('File size exceeds the limit of 2 MB');

      if (await this.postService.postExists(editPostDto.id)) {
        const identifier = `post-${editPostDto.id}`;
        const filename = await this.fileService.uploadFile(
          files.image[0],
          identifier,
        );

        editPostDto.image = filename;

        await this.postService.editPost(editPostDto);
      } else
        throw new NotFoundException(`No post found with id ${editPostDto.id}`);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new BadRequestException({ error: error.message });
    }
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.Admin, Role.Agent, Role.Admission)
  async deletePost(@Param('id') id: string): Promise<void> {
    await this.postService.deletePost(id);
  }
}
