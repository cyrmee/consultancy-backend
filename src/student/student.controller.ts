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
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { StudentService } from './student.service';
import {
  ApiTags,
  ApiBody,
  ApiBearerAuth,
  ApiOperation,
  ApiConsumes,
  ApiQuery,
} from '@nestjs/swagger';
import {
  CreateStudentDto,
  EditPassportDto,
  EditStudentAddressDto,
  EditStudentDto,
  StudentFilterDto as StudentFilterDto,
  PassportDto,
  StudentAddressDto,
  StudentDto,
  StudentWithoutApplicationDto,
  NonClientStudentDto,
  CreateNonClientStudentDto,
} from './dto';
import { JwtGuard, RolesGuard } from '../auth/guard';
import { GetUser, Roles } from '../auth/decorator';
import { Country, Gender, Role, Season } from '@prisma/client';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { FileService } from '../common/files.service';
import { EmployeeUserDto } from '../auth/dto';
import { CreateApplicationDto } from '../application/dto';

@ApiBearerAuth()
@ApiTags('students')
@UseGuards(JwtGuard, RolesGuard)
@Roles(Role.Admin, Role.Agent, Role.Admission, Role.Visa)
@Controller('students')
export class StudentController {
  constructor(
    private readonly studentService: StudentService,
    private readonly fileService: FileService,
  ) {}

  @Get()
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.Admin)
  @ApiQuery({ name: 'gender', required: false, type: String })
  @ApiQuery({ name: 'country', required: false, type: String })
  @ApiQuery({ name: 'intake', required: false, type: String })
  @ApiQuery({ name: 'isActive', required: false, type: String })
  @ApiQuery({ name: 'query', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  async queryStudents(
    @Query('gender') gender?: Gender,
    @Query('country') country?: Country,
    @Query('intake') intake?: Season,
    @Query('isActive') isActive?: string,
    @Query('query') query?: string,
    @Query('page') page: number = 1,
    @Query('pageSize') pageSize: number = 15,
  ): Promise<{ students: StudentDto[]; totalCount: number; pages: number }> {
    const filter: StudentFilterDto = {
      gender: gender,
      country: country,
      intake: intake,
      isActive: isActive ? isActive === 'true' : undefined,
    };
    return await this.studentService.queryStudents(
      filter,
      query,
      typeof page === 'string' ? parseInt(page) : page,
      typeof pageSize === 'string' ? parseInt(pageSize) : pageSize,
    );
  }

  @Get('non-client')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.Admin, Role.Agent)
  @ApiQuery({ name: 'query', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  async queryNonClientStudents(
    @Query('query') query?: string,
    @Query('page') page: number = 1,
    @Query('pageSize') pageSize: number = 15,
  ): Promise<{
    students: NonClientStudentDto[];
    totalCount: number;
    pages: number;
  }> {
    return await this.studentService.queryNonClientStudents(
      query,
      typeof page === 'string' ? parseInt(page) : page,
      typeof pageSize === 'string' ? parseInt(pageSize) : pageSize,
    );
  }

  @Get('agent')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.Agent)
  @ApiQuery({ name: 'gender', required: false, type: String })
  @ApiQuery({ name: 'country', required: false, type: String })
  @ApiQuery({ name: 'intake', required: false, type: String })
  @ApiQuery({ name: 'isActive', required: false, type: String })
  @ApiQuery({ name: 'query', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  async queryStudentsByAgent(
    @GetUser() user: EmployeeUserDto,
    @Query('gender') gender?: Gender,
    @Query('country') country?: Country,
    @Query('intake') intake?: Season,
    @Query('isActive') isActive?: string,
    @Query('query') query?: string,
    @Query('page') page: number = 1,
    @Query('pageSize') pageSize: number = 15,
  ): Promise<{ students: StudentDto[]; totalCount: number; pages: number }> {
    const filter: StudentFilterDto = {
      gender: gender,
      country: country,
      intake: intake,
      isActive: isActive ? isActive === 'true' : undefined,
    };
    return await this.studentService.queryStudentsByAgent(
      filter,
      query,
      user,
      typeof page === 'string' ? parseInt(page) : page,
      typeof pageSize === 'string' ? parseInt(pageSize) : pageSize,
    );
  }

  @Get('details/:studentId')
  async getStudentById(
    @Param('studentId') studentId: string,
    @GetUser() user: EmployeeUserDto,
  ): Promise<StudentDto | StudentWithoutApplicationDto> {
    return await this.studentService.getStudentById(studentId, user);
  }

  @Get('image/:studentId')
  async getImageById(@Param('studentId') studentId: string): Promise<string> {
    return await this.studentService.getImageById(studentId);
  }

  @Get('passport/:studentId')
  async getStudentPassportImageById(
    @Param('studentId') studentId: string,
  ): Promise<PassportDto> {
    return await this.studentService.getPassportInfoById(studentId);
  }

  @Get('address/:studentId')
  async getAddress(
    @Param('studentId') studentId: string,
  ): Promise<StudentAddressDto> {
    return await this.studentService.getAddress(studentId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiBody({ type: () => CreateStudentDto })
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.Admin, Role.Agent)
  async createStudent(
    @Body() createStudentDto: CreateStudentDto,
    @GetUser() user: EmployeeUserDto,
  ): Promise<void> {
    await this.studentService.createStudent(createStudentDto, user);
  }

  @Post('non-client')
  @HttpCode(HttpStatus.CREATED)
  @ApiBody({ type: () => CreateNonClientStudentDto })
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.Admin, Role.Agent)
  async createNonClientStudent(
    @Body() createNonClientStudentDto: CreateNonClientStudentDto,
    @GetUser() user: EmployeeUserDto,
  ): Promise<void> {
    await this.studentService.createNonClientStudent(
      createNonClientStudentDto,
      user,
    );
  }

  @Patch('activateStudent')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBody({ type: () => CreateApplicationDto })
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.Admin, Role.Agent)
  async activateStudent(
    @GetUser() user: EmployeeUserDto,
    @Body() createApplicationDto: CreateApplicationDto,
  ): Promise<void> {
    await this.studentService.activateStudent(user, createApplicationDto);
  }

  @Patch('image/:studentId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Edit Student Image by ID' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        profileImage: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.Admin, Role.Agent)
  @UseInterceptors(
    FileFieldsInterceptor([{ name: 'profileImage', maxCount: 1 }]),
  )
  async editStudentImage(
    @UploadedFiles()
    files: {
      profileImage: Express.Multer.File[];
    },
    @Param('studentId') studentId: string,
  ): Promise<void> {
    try {
      if (!files.profileImage)
        throw new BadRequestException('File is missing.');

      if (
        files.profileImage[0].mimetype !== 'image/jpeg' &&
        files.profileImage[0].mimetype !== 'image/png' &&
        files.profileImage[0].mimetype !== 'image/gif'
      ) {
        throw new BadRequestException('Only image files are allowed.');
      }

      const maxFileSize = 2 * 1024 * 1024; // 2 MB
      if (files.profileImage[0].size > maxFileSize)
        throw new BadRequestException('File size exceeds the limit of 2 MB');

      const identifier = `${studentId}`;

      if (await this.studentService.studentExists(studentId)) {
        const filename = await this.fileService.uploadFile(
          files.profileImage[0],
          identifier,
        );
        await this.studentService.editImage(studentId, filename);
      } else
        throw new NotFoundException(`Student with ID ${studentId} not found.`);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new BadRequestException({ error: error.message });
    }
  }

  @Patch('passport')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBody({ type: () => EditPassportDto })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        passportImage: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.Admin, Role.Agent)
  @UseInterceptors(
    FileFieldsInterceptor([{ name: 'passportImage', maxCount: 1 }]),
  )
  async editPassportInfo(
    @UploadedFiles()
    files: {
      passportImage: Express.Multer.File[];
    },
    @Body() editPassportDto: EditPassportDto,
  ): Promise<void> {
    try {
      if (!files.passportImage)
        throw new BadRequestException('File is missing');

      if (
        files.passportImage[0].mimetype !== 'image/jpeg' &&
        files.passportImage[0].mimetype !== 'image/png' &&
        files.passportImage[0].mimetype !== 'image/gif'
      ) {
        throw new BadRequestException('Only image files are allowed.');
      }

      const maxFileSize = 2 * 1024 * 1024; // 2 MB
      if (files.passportImage[0].size > maxFileSize)
        throw new BadRequestException('File size exceeds the limit of 2 MB');

      if (await this.studentService.studentExists(editPassportDto.studentId)) {
        const identifier = `${editPassportDto.studentId}`;
        const filename = await this.fileService.uploadFile(
          files.passportImage[0],
          identifier,
        );

        editPassportDto.passportAttachment = filename;

        await this.studentService.editPassport(editPassportDto);
      } else
        throw new NotFoundException(
          `Student with ID ${editPassportDto.studentId} not found.`,
        );
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new BadRequestException({ error: error.message });
    }
  }

  @Patch()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBody({ type: () => EditStudentDto })
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.Admin, Role.Agent)
  async editStudent(@Body() editStudentDto: EditStudentDto): Promise<void> {
    return await this.studentService.editStudent(editStudentDto);
  }

  @Patch('non-client/:studentId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.Admin, Role.Agent)
  async updateNonClientStudent(
    @Param('studentId') studentId: string,
  ): Promise<void> {
    return await this.studentService.editNonClientStudent(studentId);
  }

  @Patch('address')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBody({ type: () => EditStudentAddressDto })
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.Admin, Role.Agent)
  async editAddress(
    @Body() editStudentAddressDto: EditStudentAddressDto,
  ): Promise<void> {
    await this.studentService.editAddress(editStudentAddressDto);
  }

  @Delete(':studentId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.Admin, Role.Agent)
  async deleteStudent(@Param('studentId') studentId: string): Promise<void> {
    await this.studentService.deleteStudent(studentId);
  }

  @Delete('non-client/:studentId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.Admin, Role.Agent)
  async deleteNonClientStudent(
    @Param('studentId') studentId: string,
  ): Promise<void> {
    await this.studentService.deleteNonClientStudent(studentId);
  }

  @Delete('passport/:studentId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.Admin, Role.Agent)
  async deletePassportImage(
    @Param('studentId') studentId: string,
  ): Promise<void> {
    await this.studentService.deletePassportImage(studentId);
  }

  @Delete('image/:studentId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.Admin, Role.Agent)
  async deleteImage(@Param('studentId') studentId: string): Promise<void> {
    await this.studentService.deleteImage(studentId);
  }
}
