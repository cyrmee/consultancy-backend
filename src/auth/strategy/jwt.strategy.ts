import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { plainToInstance } from 'class-transformer';
import { EmployeeUserDto, StudentUserDto } from '../dto';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    config: ConfigService,
    private readonly database: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.get('JWT_SECRET'),
    });
  }

  async validate(payload: {
    sub: string;
    email: string;
  }): Promise<EmployeeUserDto | StudentUserDto> {
    try {
      const user = await this.database.user.findUnique({
        where: {
          id: payload.sub,
          OR: [{ isEmailVerified: true }, { isPhoneNumberVerified: true }],
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
    } catch (error) {
      console.error(error);
      return null;
    }
  }
}
