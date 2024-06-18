import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  LoginDto,
  EmployeeUserDto,
  StudentUserDto,
  ResetPasswordDto,
  StudentSignupDto,
  VerifyOtpByEmailDto,
  VerifyOtpByPhoneNumberDto,
  ChangePasswordDto,
  EditGoogleTokenDto,
} from './dto';
import { ApiBody, ApiTags } from '@nestjs/swagger';
import { GetUser, Roles } from './decorator';
import { JwtGuard, RolesGuard } from './guard';
import { Role } from '@prisma/client';
import { UserDto } from '../user/dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('studentStatus')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.Student)
  async getStudentIsActiveStatus(
    @GetUser() user: StudentUserDto,
  ): Promise<boolean> {
    return await this.authService.getStudentIsActiveStatus(user.id);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiBody({ type: LoginDto })
  async login(@Body() loginDto: LoginDto): Promise<{
    user: EmployeeUserDto;
    token: { access_token: string };
  }> {
    return await this.authService.employeeLogin(loginDto);
  }

  @Post('studentLogin')
  @HttpCode(HttpStatus.OK)
  @ApiBody({ type: LoginDto })
  async studentLogin(
    @Body() loginDto: LoginDto,
  ): Promise<{ user: StudentUserDto; token: { access_token: string } }> {
    return await this.authService.studentLogin(loginDto);
  }

  @Post('studentSignup')
  @HttpCode(HttpStatus.CREATED)
  @ApiBody({ type: StudentSignupDto })
  async studentSignup(
    @Body() studentSignupDto: StudentSignupDto,
  ): Promise<{ user: StudentUserDto; token: { access_token: string } }> {
    return await this.authService.studentSignup(studentSignupDto);
  }

  @Post('sendOtpByEmail/:email')
  @HttpCode(HttpStatus.CREATED)
  async sendOtpByEmail(@Param('email') email: string): Promise<void> {
    await this.authService.sendOtpByEmail(email);
  }

  @Patch('verifyOtpByEmail')
  @HttpCode(HttpStatus.CREATED)
  @ApiBody({ type: VerifyOtpByEmailDto })
  async verifyOtpByEmail(
    @Body() verifyOtpDto: VerifyOtpByEmailDto,
  ): Promise<void> {
    await this.authService.verifyOtpByEmail(verifyOtpDto);
  }

  @Post('sendOtpByPhoneNumber/:phoneNumber')
  @HttpCode(HttpStatus.CREATED)
  async sendOtpByPhoneNumber(
    @Param('phoneNumber') phoneNumber: string,
  ): Promise<void> {
    await this.authService.sendOtpByPhoneNumber(phoneNumber);
  }

  @Patch('verifyOtpByPhoneNumber')
  @HttpCode(HttpStatus.CREATED)
  @ApiBody({ type: VerifyOtpByPhoneNumberDto })
  async verifyOtp(
    @Body() verifyOtpByPhoneNumberDto: VerifyOtpByPhoneNumberDto,
  ): Promise<void> {
    await this.authService.verifyOtpByPhoneNumber(verifyOtpByPhoneNumberDto);
  }

  @Patch('request-password-reset/:email')
  @HttpCode(HttpStatus.NO_CONTENT)
  async requestPasswordReset(@Param('email') email: string): Promise<void> {
    await this.authService.requestPasswordReset(email);
  }

  @Patch('request-password-reset-mobile/:email')
  @HttpCode(HttpStatus.NO_CONTENT)
  async requestPasswordResetMobile(
    @Param('email') email: string,
  ): Promise<void> {
    await this.authService.requestPasswordResetMobile(email);
  }

  @Patch('reset-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBody({ type: () => ResetPasswordDto })
  async resetPassword(
    @Body() resetPasswordDto: ResetPasswordDto,
  ): Promise<void> {
    await this.authService.resetPassword(resetPasswordDto);
  }

  @Patch('change-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBody({ type: () => ChangePasswordDto })
  async changePassword(
    @Body() changePasswordDto: ChangePasswordDto,
  ): Promise<void> {
    await this.authService.changePassword(changePasswordDto);
  }

  @Post('verifyToken')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.Admin, Role.Agent, Role.Admission, Role.Finance, Role.Visa)
  async verifyTokenFromHeader(
    @Headers('authorization') authorizationHeader: string,
    @GetUser() user: EmployeeUserDto,
  ): Promise<void> {
    if (!authorizationHeader) {
      throw new BadRequestException('Authorization header is missing');
    }

    const token = this.authService.extractBearerToken(authorizationHeader);

    if (!token) {
      throw new BadRequestException('Bearer token is missing');
    }

    if (!user) throw new UnauthorizedException();

    await this.authService.verifyToken(token);
  }

  @Post('verifyStudentToken')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.Student)
  async verifyStudentTokenFromHeader(
    @Headers('authorization') authorizationHeader: string,
    @GetUser() user: StudentUserDto,
  ): Promise<void> {
    if (!authorizationHeader) {
      throw new BadRequestException('Authorization header is missing');
    }

    const token = this.authService.extractBearerToken(authorizationHeader);

    if (!token) {
      throw new BadRequestException('Bearer token is missing');
    }

    if (!user) throw new UnauthorizedException();

    await this.authService.verifyToken(token);
  }

  @Patch('google-token')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBody({ type: () => EditGoogleTokenDto })
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.Admin, Role.Finance, Role.Visa)
  async updateGoogleToken(
    @Body() editGoogleTokenDto: EditGoogleTokenDto,
    @GetUser() user: UserDto,
  ): Promise<void> {
    await this.authService.updateGoogleToken(editGoogleTokenDto, user);
  }

  @Patch('google-logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.Admin, Role.Finance, Role.Visa)
  async logoutGoogleCalendar(@GetUser() user: UserDto): Promise<void> {
    await this.authService.logoutGoogleCalendar(user);
  }
}
