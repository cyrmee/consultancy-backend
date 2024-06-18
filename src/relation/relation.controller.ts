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
import {
  CreateStudentRelationsDto,
  EditStudentRelationsDto,
  StudentRelationsDto,
} from './dto';
import { RelationService } from './relation.service';
import { ApiBearerAuth, ApiBody, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../auth/decorator';
import { JwtGuard, RolesGuard } from '../auth/guard';

@ApiBearerAuth()
@ApiTags('relation')
@UseGuards(JwtGuard, RolesGuard)
@Roles(Role.Admin, Role.Agent, Role.Admission, Role.Finance, Role.Visa)
@Controller('relation')
export class RelationController {
  constructor(private readonly relationService: RelationService) {}

  @Get('student/:studentId')
  async getRelations(
    @Param('studentId') studentId: string,
  ): Promise<StudentRelationsDto[]> {
    return await this.relationService.getRelations(studentId);
  }

  @Get(':relationId')
  async getRelationById(
    @Param('relationId') relationId: string,
  ): Promise<StudentRelationsDto> {
    return await this.relationService.getRelationById(relationId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiBody({ type: () => CreateStudentRelationsDto })
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.Admin, Role.Agent)
  async createRelation(
    @Body() createStudentRelationDto: CreateStudentRelationsDto,
  ): Promise<void> {
    await this.relationService.createRelation(createStudentRelationDto);
  }

  @Patch()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBody({ type: () => EditStudentRelationsDto })
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.Admin, Role.Agent)
  async editRelation(
    @Body() editStudentRelationsDto: EditStudentRelationsDto,
  ): Promise<void> {
    await this.relationService.editRelation(editStudentRelationsDto);
  }

  @Delete(':relationId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.Admin, Role.Agent)
  async deleteRelation(@Param('relationId') relationId: string): Promise<void> {
    await this.relationService.deleteRelation(relationId);
  }
}
