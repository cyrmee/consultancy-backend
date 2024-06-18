import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Relationship } from '@prisma/client';
import {
  CreateStudentRelationsDto,
  EditStudentRelationsDto,
  StudentRelationsDto,
} from './dto';
import { PrismaService } from '../prisma/prisma.service';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class RelationService {
  constructor(private readonly database: PrismaService) {}

  async getRelations(studentId: string): Promise<StudentRelationsDto[]> {
    try {
      const student = await this.database.student.findUnique({
        where: { id: studentId },
        include: {
          studentRelations: true,
        },
      });

      if (!student)
        throw new NotFoundException(`Student with ID ${studentId} not found.`);

      return plainToInstance(StudentRelationsDto, student.studentRelations, {
        excludeExtraneousValues: true,
      });
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async getRelationById(relationId: string): Promise<StudentRelationsDto> {
    try {
      const relation = await this.database.studentRelations.findUnique({
        where: { id: relationId },
      });

      if (!relation)
        throw new NotFoundException(
          `Relation with ID ${relationId} not found.`,
        );

      return plainToInstance(StudentRelationsDto, relation, {
        excludeExtraneousValues: true,
      });
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async createRelation(
    createStudentRelationsDto: CreateStudentRelationsDto,
  ): Promise<void> {
    try {
      const student = await this.database.student.findUnique({
        where: {
          id: createStudentRelationsDto.studentId,
        },
      });

      if (!student)
        throw new NotFoundException(
          `Student with ID ${createStudentRelationsDto.studentId} not found.`,
        );

      if (
        createStudentRelationsDto.relationship === Relationship.Father ||
        createStudentRelationsDto.relationship === Relationship.Mother
      ) {
        const existingRelation = await this.database.studentRelations.findFirst(
          {
            where: {
              studentId: createStudentRelationsDto.studentId,
              relationship: createStudentRelationsDto.relationship,
            },
          },
        );

        if (existingRelation)
          throw new BadRequestException(
            `Relation already exists for ${createStudentRelationsDto.relationship}`,
          );
      }

      await this.database.studentRelations.create({
        data: {
          firstName: createStudentRelationsDto.firstName,
          lastName: createStudentRelationsDto.lastName,
          phoneNumber: createStudentRelationsDto.phoneNumber,
          educationalLevel: createStudentRelationsDto.educationalLevel,
          dateOfBirth: createStudentRelationsDto.dateOfBirth,
          relationship: createStudentRelationsDto.relationship,
          student: {
            connect: {
              id: createStudentRelationsDto.studentId,
            },
          },
        },
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

  async editRelation(editRelationsDto: EditStudentRelationsDto): Promise<void> {
    try {
      const studentRelation = await this.database.studentRelations.findUnique({
        where: { id: editRelationsDto.id },
      });

      if (!studentRelation)
        throw new NotFoundException(
          `Relation with ID ${editRelationsDto.id} not found.`,
        );

      await this.database.studentRelations.update({
        where: { id: editRelationsDto.id },
        data: {
          firstName: editRelationsDto.firstName,
          lastName: editRelationsDto.lastName,
          phoneNumber: editRelationsDto.phoneNumber,
          educationalLevel: editRelationsDto.educationalLevel,
          dateOfBirth: editRelationsDto.dateOfBirth,
          updatedAt: new Date(Date.now()),
        },
      });
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async deleteRelation(relationId: string): Promise<void> {
    try {
      const relation = await this.database.studentRelations.findUnique({
        where: { id: relationId },
      });

      if (!relation)
        throw new NotFoundException(
          `Relation with ID ${relationId} not found.`,
        );

      await this.database.studentRelations.delete({
        where: { id: relationId },
      });
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
}
