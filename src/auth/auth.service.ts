import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
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
import * as argon from 'argon2';
import { Transform, plainToInstance } from 'class-transformer';
import { ConversationType, Role } from '@prisma/client';
import { CryptoService } from '../common/crypto.service';
import { MailService } from '../mail/mail.service';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { IsEmail, validate } from 'class-validator';
import { calendar_v3, google } from 'googleapis';
import { UserDto } from '../user/dto';

@Injectable()
export class AuthService {
  constructor(
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly database: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly cryptoService: CryptoService,
    private readonly mailService: MailService,
  ) {}

  private async validateEmail(fieldName: string, email: string) {
    class EmailDto {
      @IsEmail()
      @Transform(({ value }) => (value ? value.toLowerCase() : value))
      value: string;
    }

    const dto = new EmailDto();
    dto.value = email;

    const errors = await validate(dto);
    if (errors.length > 0) {
      throw new BadRequestException(
        `${fieldName} ${errors[0].constraints.isEmail}`,
      );
    }
  }

  async verifyToken(token: string): Promise<any> {
    try {
      const decoded = await this.jwt.verifyAsync(token, {
        secret: this.config.get('JWT_SECRET'),
        ignoreExpiration: false,
      });
      return decoded;
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  async validateUser(
    bearerToken: string,
  ): Promise<EmployeeUserDto | StudentUserDto> {
    const token = this.extractBearerToken(bearerToken);
    const payload = await this.verifyToken(token);
    const user = await this.database.user.findUnique({
      where: {
        id: payload.sub,
      },
      include: {
        employee: true,
        student: true,
      },
    });

    let userDto:
      | EmployeeUserDto
      | StudentUserDto
      | PromiseLike<EmployeeUserDto | StudentUserDto>;

    if (!user) {
      return null;
    }

    if (user.student)
      userDto = plainToInstance(StudentUserDto, user, {
        excludeExtraneousValues: true,
      });

    if (user.employee)
      userDto = plainToInstance(EmployeeUserDto, user, {
        excludeExtraneousValues: true,
      });

    return userDto;
  }

  async getStudentIsActiveStatus(userId: string): Promise<boolean> {
    try {
      const user = await this.database.user.findUnique({
        where: { id: userId },
        include: {
          student: true,
        },
      });

      if (!user) return false;

      return user.student.isActive;
    } catch (error) {
      return false;
    }
  }

  async employeeLogin(loginDto: LoginDto): Promise<{
    user: EmployeeUserDto;
    token: { access_token: string };
  }> {
    const user = await this.database.user.findUnique({
      where: {
        email: loginDto.email,
      },
      include: {
        employee: true,
      },
    });

    if (!user) throw new ForbiddenException('Credentials incorrect');

    if (await this.checkRoles(user.id, [Role.Student]))
      throw new ForbiddenException(
        `If you're an student please use the mobile app to login.`,
      );

    if (!(await argon.verify(user.hash, loginDto.password)))
      throw new ForbiddenException('Credentials incorrect');

    const userDto = plainToInstance(EmployeeUserDto, user, {
      excludeExtraneousValues: true,
    });

    return {
      user: userDto,
      token: await this.signEmployeeToken(
        user.id,
        user.email,
        user.employee.id,
      ),
    };
  }

  async studentLogin(
    loginDto: LoginDto,
  ): Promise<{ user: StudentUserDto; token: { access_token: string } }> {
    const user = await this.database.user.findUnique({
      where: {
        email: loginDto.email,
      },
      include: {
        student: true,
      },
    });

    if (!user) throw new ForbiddenException('Credentials incorrect');

    if (!(await this.checkRoles(user.id, [Role.Student])))
      throw new ForbiddenException(
        `If you're an employee please use the web portal to login.`,
      );

    if (!(await argon.verify(user.hash, loginDto.password)))
      throw new ForbiddenException('Credentials incorrect');

    if (!user.isPhoneNumberVerified && !user.isEmailVerified)
      throw new ForbiddenException('Please verify your email or phone number');

    // TODO: Check if the user has changed their password

    const userDto = plainToInstance(StudentUserDto, user, {
      excludeExtraneousValues: true,
    });

    return {
      user: userDto,
      token: await this.signStudentToken(user.id, user.email, user.student.id),
    };
  }

  async changePassword(changePasswordDto: ChangePasswordDto): Promise<void> {
    try {
      const user = await this.database.user.findUnique({
        where: {
          email: changePasswordDto.email,
        },
      });

      if (await argon.verify(user.hash, changePasswordDto.newPassword))
        throw new ForbiddenException('New password cannot be the same');

      if (!user) throw new ForbiddenException('Credentials incorrect');

      if (!user.isEmailVerified)
        throw new ForbiddenException('Please verify your email');

      if (!(await argon.verify(user.hash, changePasswordDto.currentPassword)))
        throw new ForbiddenException('Credentials incorrect');

      await this.database.user.update({
        where: {
          id: user.id,
        },
        data: {
          hash: await argon.hash(changePasswordDto.newPassword),
          updatedAt: new Date(Date.now()),
        },
      });
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async requestPasswordReset(email: string): Promise<void> {
    try {
      if (email) {
        await this.validateEmail('E-mail', email);
        email = email.toLowerCase();
      }

      const user = await this.database.user.findUnique({
        where: { email: email, NOT: { roles: { has: Role.Student } } },
      });

      if (!user) {
        throw new NotFoundException(`User with email ${email} not found.`);
      }

      const token = await this.cryptoService.generateRandomToken();
      await this.cacheManager.set(`resetPassword-${email}`, token, 600000);
      await this.mailService.sendResetPasswordToken(email, token);
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async requestPasswordResetMobile(email: string): Promise<void> {
    try {
      if (email) {
        await this.validateEmail('E-mail', email);
        email = email.toLowerCase();
      }

      const user = await this.database.user.findUnique({
        where: { email: email, roles: { has: Role.Student } },
      });

      if (!user) {
        throw new NotFoundException(`User with email ${email} not found.`);
      }

      const token = await this.generateOtp();
      await this.cacheManager.set(`resetPassword-${email}`, token, 600000);
      await this.mailService.sendResetPasswordTokenMobile(email, token);
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<void> {
    try {
      const user = await this.database.user.findUnique({
        where: {
          email: resetPasswordDto.email,
        },
      });

      if (!user) {
        throw new ForbiddenException('Invalid or expired token.');
      }

      const token = await this.cacheManager.get(
        `resetPassword-${resetPasswordDto.email}`,
      );

      if (!token) {
        throw new ForbiddenException('Invalid or expired token.');
      }

      if (token !== resetPasswordDto.resetPasswordToken)
        throw new ForbiddenException('Invalid or expired token.');

      await this.cacheManager.del(`resetPassword-${resetPasswordDto.email}`);

      await this.database.user.update({
        where: { email: user.email },
        data: {
          hash: await argon.hash(resetPasswordDto.password),
          updatedAt: new Date(Date.now()),
        },
      });
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async generateOtp(): Promise<string> {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async sendOtpByEmail(email: string): Promise<void> {
    const user = await this.database.user.findUnique({
      where: {
        email: email,
        roles: { has: Role.Student },
      },
      include: {
        student: true,
      },
    });

    if (!user) throw new ForbiddenException('Invalid user');
    const otp = await this.generateOtp();
    await this.cacheManager.set(email, otp, 600000);
    await this.mailService.sendOTP(email, otp);
  }

  async verifyOtpByEmail(
    verifyOtpByEmailDto: VerifyOtpByEmailDto,
  ): Promise<{ user: StudentUserDto; token: { access_token: string } }> {
    const user = await this.database.user.update({
      where: {
        email: verifyOtpByEmailDto.email,
        roles: { has: Role.Student },
      },
      data: {
        isEmailVerified: true,
        updatedAt: new Date(Date.now()),
      },
      include: {
        student: true,
      },
    });

    if (!user) throw new ForbiddenException('Invalid user');

    const otp = await this.cacheManager.get(verifyOtpByEmailDto.email);

    if (!otp) throw new BadRequestException('OTP expired');

    if (otp !== verifyOtpByEmailDto.otp)
      throw new BadRequestException('Invalid OTP');

    await this.cacheManager.del(verifyOtpByEmailDto.email);

    const userDto = plainToInstance(StudentUserDto, user, {
      excludeExtraneousValues: true,
    });

    return {
      user: userDto,
      token: await this.signStudentToken(user.student.id, user.email, user.id),
    };
  }

  async sendOtpByPhoneNumber(phoneNumber: string): Promise<void> {
    const user = await this.database.user.findUnique({
      where: {
        phoneNumber: phoneNumber,
        roles: { has: Role.Student },
      },
      include: {
        student: true,
      },
    });

    if (!user) throw new ForbiddenException('Invalid user');
    const otp = await this.generateOtp();
    await this.cacheManager.set(phoneNumber, otp, 600000);
    // TODO: send using sms api
    console.log(`OTP: ${otp}`);
  }

  async verifyOtpByPhoneNumber(
    verifyOtpByPhoneNumberDto: VerifyOtpByPhoneNumberDto,
  ): Promise<{ user: StudentUserDto; token: { access_token: string } }> {
    const user = await this.database.user.update({
      where: {
        phoneNumber: verifyOtpByPhoneNumberDto.phoneNumber,
        roles: { has: Role.Student },
      },
      data: {
        isPhoneNumberVerified: true,
        updatedAt: new Date(Date.now()),
      },
      include: {
        student: true,
      },
    });

    if (!user) throw new ForbiddenException('Invalid user');

    const otp = await this.cacheManager.get(
      verifyOtpByPhoneNumberDto.phoneNumber,
    );

    if (!otp) throw new BadRequestException('OTP expired');

    if (otp !== verifyOtpByPhoneNumberDto.otp)
      throw new BadRequestException('Invalid OTP');

    await this.cacheManager.del(verifyOtpByPhoneNumberDto.phoneNumber);

    const userDto = plainToInstance(StudentUserDto, user, {
      excludeExtraneousValues: true,
    });

    return {
      user: userDto,
      token: await this.signStudentToken(user.student.id, user.email, user.id),
    };
  }

  async studentSignup(
    studentSignupDto: StudentSignupDto,
  ): Promise<{ user: StudentUserDto; token: { access_token: string } }> {
    const existingEmail = await this.database.user.findFirst({
      where: { email: studentSignupDto.email },
    });

    const existingPhone = await this.database.user.findFirst({
      where: {
        phoneNumber: studentSignupDto.phoneNumber,
      },
    });

    if (existingEmail) {
      throw new BadRequestException('Email already exists');
    }

    if (existingPhone) {
      throw new BadRequestException('Phone number already exists');
    }

    try {
      return await this.database.$transaction(async () => {
        const agent = await this.database.employee.findFirst({
          where: {
            user: {
              roles: { hasSome: [Role.Agent] },
            },
            studentAssignmentCount: { gte: 0 },
            isSuspended: false,
          },
          orderBy: { studentAssignmentCount: 'asc' },
        });

        const student = await this.database.student.create({
          data: {
            firstName: studentSignupDto.firstName,
            lastName: studentSignupDto.lastName,
            gender: studentSignupDto.gender,
            dateOfBirth: studentSignupDto.dateOfBirth,
            admissionEmail: studentSignupDto.email,
            user: {
              create: {
                email: studentSignupDto.email,
                firstName: studentSignupDto.firstName,
                lastName: studentSignupDto.lastName,
                phoneNumber: studentSignupDto.phoneNumber,
                gender: studentSignupDto.gender,
                hash: await argon.hash(studentSignupDto.password),
                roles: [Role.Student],
              },
            },
            // * This will assign agents to students (uncomment if you want to assign agents to students during their signup)
            // ...(agent && {
            //   agent: {
            //     connect: {
            //       id: agent.id,
            //     },
            //   },
            // }),
            studentAddress: {
              create: {
                region: studentSignupDto.region,
                city: studentSignupDto.city,
                subCity: studentSignupDto.subCity,
                woreda: studentSignupDto.woreda,
                kebele: studentSignupDto.kebele,
                houseNumber: studentSignupDto.houseNumber,
              },
            },
          },
          include: {
            user: true,
          },
        });

        if (student.agentId)
          await this.database.employee.update({
            where: { id: agent.id },
            data: {
              studentAssignmentCount: agent.studentAssignmentCount + 1,
            },
          });

        const forums = await this.database.conversation.findMany({
          where: {
            participants: {
              none: { id: student.userId },
            },
            type: ConversationType.Forum,
          },
          select: {
            id: true,
          },
        });

        if (forums)
          forums.forEach(async (forum) => {
            await this.database.conversation.update({
              where: { id: forum.id },
              data: {
                participants: {
                  connect: [{ id: student.userId }],
                },
                updatedAt: new Date(Date.now()),
              },
            });
          });

        const userDto = plainToInstance(StudentUserDto, student.user, {
          excludeExtraneousValues: true,
        });

        return {
          user: userDto,
          token: await this.signStudentToken(
            student.user.id,
            student.user.email,
            student.id,
          ),
        };
      });
    } catch (error) {
      console.error(error);
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new BadRequestException(
            existingEmail
              ? 'Email already exists'
              : 'Phone number already exists',
          );
        }
      }
      throw error;
    }
  }

  async updateGoogleToken(
    editGoogleTokenDto: EditGoogleTokenDto,
    user: UserDto,
  ): Promise<void> {
    try {
      const loggedInUser = await this.database.user.findUnique({
        where: {
          id: user.id,
        },
      });

      if (!loggedInUser) throw new BadRequestException('Invalid user');

      const oauth2Client = new google.auth.OAuth2(
        this.config.get('GOOGLE_CLIENT_ID'),
        this.config.get('GOOGLE_CLIENT_SECRET'),
      );

      oauth2Client.setCredentials({
        access_token: editGoogleTokenDto.access_token,
        // refresh_token: editGoogleTokenDto.refresh_token,
        // expiry_date: editGoogleTokenDto.expires_in,
        // token_type: 'Bearer',
        // scope: 'https://www.googleapis.com/auth/calendar',
      });

      const calendar = google.calendar({
        version: 'v3',
        auth: oauth2Client,
      });

      let localCalendarId: string;

      const calendarList = await calendar.calendarList.list();
      const workCalendar = calendarList.data.items.find(
        (cal) => cal.summary === 'Consultancy Calendar',
      );

      if (!workCalendar) {
        const newCalendar = await calendar.calendars.insert({
          requestBody: {
            summary: 'Consultancy Calendar',
            description: 'A calendar for Consultancy related events',
            timeZone: 'UTC',
          },
        });
        localCalendarId = newCalendar.data.id;
      } else {
        localCalendarId = workCalendar.id;
      }

      await this.database.user.update({
        where: {
          id: loggedInUser.id,
        },
        data: {
          access_token: editGoogleTokenDto.access_token,
          expires_in: editGoogleTokenDto.expires_in,
          calendarId: localCalendarId,
          updatedAt: new Date(Date.now()),
        },
      });
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async logoutGoogleCalendar(user: UserDto): Promise<void> {
    try {
      const loggedInUser = await this.database.user.findUnique({
        where: {
          id: user.id,
        },
      });

      if (!loggedInUser) throw new BadRequestException('Invalid user');

      if (user.access_token)
        await this.database.user.update({
          where: {
            id: user.id,
          },
          data: {
            access_token: null,
            expires_in: null,
            calendarId: null,
            updatedAt: new Date(Date.now()),
          },
        });
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async googleCalendarAuth(user: UserDto): Promise<calendar_v3.Calendar> {
    const authenticatedUser = await this.database.user.findUnique({
      where: {
        id: user.id,
        access_token: { not: null },
        expires_in: { not: null },
        calendarId: { not: null },
        NOT: {
          roles: {
            hasSome: [Role.Student],
          },
        },
      },
      include: {
        employee: true,
      },
    });

    if (!authenticatedUser)
      throw new BadRequestException(
        'User not authenticated, please sign in using google!',
      );

    const oauth2Client = new google.auth.OAuth2(
      this.config.get('GOOGLE_CLIENT_ID'),
      this.config.get('GOOGLE_CLIENT_SECRET'),
    );

    oauth2Client.setCredentials({
      access_token: authenticatedUser.access_token,
      // refresh_token: authenticatedUser.refresh_token,
      expiry_date: authenticatedUser.expires_in,
      token_type: 'Bearer',
      scope: 'https://www.googleapis.com/auth/calendar',
    });

    try {
      // Ensure the access token is valid and refresh if necessary
      await oauth2Client.getAccessToken();

      // Update the user in the database if the token was refreshed
      const tokens = oauth2Client.credentials;
      if (tokens.access_token && tokens.expiry_date) {
        await this.database.user.update({
          where: {
            id: authenticatedUser.id,
          },
          data: {
            access_token: tokens.access_token,
            expires_in: tokens.expiry_date,
            updatedAt: new Date(Date.now()),
          },
        });
      }
    } catch (err) {
      console.error('Error refreshing access token:', err);
      if (err.message.includes('invalid_grant')) {
        throw new HttpException(
          'Invalid refresh token, please re-authenticate.',
          HttpStatus.ACCEPTED,
        );
      } else {
        throw err;
      }
    }

    return google.calendar({
      version: 'v3',
      auth: oauth2Client,
    });
  }

  async checkRoles(userId: string, roles: Role[]): Promise<boolean> {
    try {
      const user = await this.database.user.findUnique({
        where: {
          id: userId,
        },
      });

      if (!user) return false;

      return roles.some((role) => user.roles.includes(role));
    } catch (error) {
      return false;
    }
  }

  async signEmployeeToken(
    userId: string,
    email: string,
    employeeId: string,
  ): Promise<{ access_token: string }> {
    const payload = {
      sub: userId,
      email: email,
      employeeId: employeeId,
    };

    const token = await this.jwt.signAsync(payload, {
      expiresIn: this.config.get('JWT_EXPIRATION_TIME'),
      secret: this.config.get('JWT_SECRET'),
    });

    return {
      access_token: token,
    };
  }

  async signStudentToken(
    userId: string,
    email: string,
    studentId: string,
  ): Promise<{ access_token: string }> {
    const payload = {
      sub: userId,
      email: email,
      studentId: studentId,
    };

    const token = await this.jwt.signAsync(payload, {
      expiresIn: this.config.get('JWT_EXPIRATION_TIME'),
      secret: this.config.get('JWT_SECRET'),
    });

    return {
      access_token: token,
    };
  }

  extractBearerToken(authorizationHeader: string): string | null {
    const match = authorizationHeader.match(/Bearer (.+)/);
    return match ? match[1] : null;
  }
}
