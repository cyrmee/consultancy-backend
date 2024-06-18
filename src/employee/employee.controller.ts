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
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  EmployeeDto,
  CreateEmployeeDto,
  EditEmployeeDto,
  EmployeeFilterDto,
} from './dto';
import { EmployeeService } from './employee.service';
import { ApiBearerAuth, ApiBody, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Gender, Role } from '@prisma/client';
import { Roles } from '../auth/decorator';
import { JwtGuard, RolesGuard } from '../auth/guard';

@ApiBearerAuth()
@ApiTags('employees')
@Controller('employees')
@UseGuards(JwtGuard, RolesGuard)
@Roles(Role.Admin)
export class EmployeeController {
  constructor(private readonly employeeService: EmployeeService) {}

  @Get()
  @ApiQuery({ name: 'role', required: false, type: String })
  @ApiQuery({ name: 'gender', required: false, type: String })
  @ApiQuery({ name: 'query', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  async queryEmployees(
    @Query('role') role?: Role,
    @Query('gender') gender?: Gender,
    @Query('query') query?: string,
    @Query('page') page: number = 1,
    @Query('pageSize') pageSize: number = 15,
  ): Promise<{ employees: EmployeeDto[]; totalCount: number; pages: number }> {
    const filter: EmployeeFilterDto = {
      role: role,
      gender: gender,
    };
    return await this.employeeService.queryEmployees(
      filter,
      query,
      typeof page === 'string' ? parseInt(page) : page,
      typeof pageSize === 'string' ? parseInt(pageSize) : pageSize,
    );
  }

  @Get(':employeeId')
  async getEmployee(
    @Param('employeeId') employeeId: string,
  ): Promise<EmployeeDto> {
    return await this.employeeService.getEmployee(employeeId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiBody({ type: () => CreateEmployeeDto })
  async createEmployee(
    @Body() createEmployeeDto: CreateEmployeeDto,
  ): Promise<void> {
    await this.employeeService.createEmployee(createEmployeeDto);
  }

  @Patch()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBody({ type: () => EditEmployeeDto })
  async editEmployee(@Body() editEmployeeDto: EditEmployeeDto): Promise<void> {
    await this.employeeService.editEmployee(editEmployeeDto);
  }

  @Delete(':employeeId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteEmployee(@Param('employeeId') employeeId: string): Promise<void> {
    await this.employeeService.deleteEmployee(employeeId);
  }
}
