import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CalendarDto, CreateCalendarDto, EditCalendarDto } from './dto';
import { EmployeeUserDto } from '../auth/dto';
import { plainToInstance } from 'class-transformer';
import { AuthService } from '../auth/auth.service';
import { Role } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { google } from 'googleapis';
import { UserDto } from '../user/dto';

@Injectable()
export class CalendarService {
  constructor(
    private readonly database: PrismaService,
    private readonly authService: AuthService,
    private readonly config: ConfigService,
  ) {}

  async getCalendars(user: EmployeeUserDto): Promise<CalendarDto[]> {
    try {
      let calendars = await this.database.calendar.findMany({
        where: {
          employeeId: user.employee.id,
        },
      });

      if (await this.authService.checkRoles(user.id, [Role.Admin])) {
        calendars = await this.database.calendar.findMany();
      }

      return plainToInstance(CalendarDto, calendars, {
        excludeExtraneousValues: true,
      });
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async getMissedEvents(user: EmployeeUserDto): Promise<CalendarDto[]> {
    try {
      let calendars = await this.database.calendar.findMany({
        where: {
          employeeId: user.employee.id,
          isAttended: false,
          startDate: {
            lte: new Date(),
          },
          endDate: {
            lte: new Date(),
          },
        },
      });

      if (await this.authService.checkRoles(user.id, [Role.Admin])) {
        calendars = await this.database.calendar.findMany({
          where: {
            isAttended: false,
            startDate: {
              lte: new Date(),
            },
            endDate: {
              lte: new Date(),
            },
          },
        });
      }

      return plainToInstance(CalendarDto, calendars, {
        excludeExtraneousValues: true,
      });
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async syncCalendars(user: UserDto): Promise<void> {
    try {
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

      let calendarEvents: any[];
      if (authenticatedUser.roles.includes(Role.Admin)) {
        calendarEvents = await this.database.calendar.findMany();
      } else
        calendarEvents = await this.database.calendar.findMany({
          where: {
            employeeId: authenticatedUser.employee.id,
          },
        });

      const oauth2Client = new google.auth.OAuth2(
        this.config.get('GOOGLE_CLIENT_ID'),
        this.config.get('GOOGLE_CLIENT_SECRET'),
      );

      oauth2Client.setCredentials({
        access_token: authenticatedUser.access_token,
        // expiry_date: user.expires_in,
      });

      const calendar = google.calendar({
        version: 'v3',
        auth: oauth2Client,
      });

      const listResponse = await calendar.calendarList.list({});

      const calendars = listResponse.data.items;

      if (calendars) {
        const localCalendars = calendars.filter(
          (cal) => cal.summary === 'Consultancy Calendar',
        );

        for (const cal of localCalendars) {
          await calendar.calendars.delete({
            calendarId: cal.id,
          });
        }
      }

      const newCalendar = await calendar.calendars.insert({
        requestBody: {
          summary: 'Consultancy Calendar',
          description: 'A calendar for Consultancy related events',
          timeZone: 'UTC',
        },
      });

      calendarEvents.forEach(async (calendarEvent) => {
        await calendar.events.insert({
          calendarId: newCalendar.data.id,
          requestBody: {
            summary: calendarEvent.title,
            description: calendarEvent.description,
            start: {
              date: calendarEvent.startDate.toISOString().split('T')[0],
              timeZone: 'UTC', // Optionally, specify the time zone
            },
            end: {
              date: calendarEvent.endDate.toISOString().split('T')[0],
              timeZone: 'UTC', // Optionally, specify the time zone
            },
            reminders: {
              useDefault: true,
            },
            colorId: calendarEvent.googleColor,
          },
        });
      });

      await this.database.user.update({
        where: {
          id: authenticatedUser.id,
        },
        data: {
          calendarId: newCalendar.data.id,
          updatedAt: new Date(Date.now()),
        },
      });
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async createCalendar(createCalendarDto: CreateCalendarDto, user: UserDto) {
    try {
      const localEvent = await this.database.calendar.create({
        data: {
          startDate: createCalendarDto.startDate,
          endDate: createCalendarDto.endDate,
          externalId: createCalendarDto.externalId,
          title: createCalendarDto.title,
          description: createCalendarDto.description,
          color: createCalendarDto.color,
          googleColor: createCalendarDto.googleColor,
          application: {
            connect: { id: createCalendarDto.applicationId },
          },
          employee: {
            connect: {
              id: createCalendarDto.employeeId,
            },
          },
        },
      });

      if (user.access_token) {
        try {
          const oauth2Client = new google.auth.OAuth2(
            this.config.get('GOOGLE_CLIENT_ID'),
            this.config.get('GOOGLE_CLIENT_SECRET'),
          );

          oauth2Client.setCredentials({
            access_token: user.access_token,
            // expiry_date: user.expires_in,
          });

          const calendar = google.calendar({
            version: 'v3',
            auth: oauth2Client,
          });

          const event = await calendar.events.insert({
            calendarId: user.calendarId,
            requestBody: {
              summary: createCalendarDto.title,
              description: createCalendarDto.description,
              start: {
                date: createCalendarDto.startDate.toISOString().split('T')[0],
                timeZone: 'UTC', // Optionally, specify the time zone
              },
              end: {
                date: createCalendarDto.endDate.toISOString().split('T')[0],
                timeZone: 'UTC', // Optionally, specify the time zone
              },
              reminders: {
                overrides: [
                  { method: 'email', minutes: 24 * 60 },
                  { method: 'email', minutes: 48 * 60 },
                  { method: 'email', minutes: 72 * 60 },
                  { method: 'popup', minutes: 24 * 60 },
                  { method: 'popup', minutes: 48 * 60 },
                  { method: 'popup', minutes: 72 * 60 },
                ],
              },
              colorId: createCalendarDto.googleColor,
            },
          });

          await this.database.calendar.update({
            where: {
              externalId: localEvent.id,
            },
            data: {
              googleCalenderEventId: event.data.id,
              updatedAt: new Date(Date.now()),
            },
          });
        } catch (error) {
          console.error('Google Calendar API Error: ', error);
          // throw new HttpException(
          //   'Google Calendar API Error',
          //   HttpStatus.ACCEPTED,
          // );
        }
      }
    } catch (error) {
      console.error(error);
      if (error.code === 'P2002')
        throw new BadRequestException(`${error.meta.target} already exists`);
      else if (error.code === 'P2025')
        throw new BadRequestException(`${error.meta.cause}`);
      throw error;
    }
  }

  async editCalendar(
    editCalendarDto: EditCalendarDto,
    user: UserDto,
  ): Promise<void> {
    try {
      const localEvent = await this.database.calendar.findUnique({
        where: {
          externalId: editCalendarDto.externalId,
        },
      });

      // if (!localEvent) return;

      const updatedLocalEvent = await this.database.calendar.update({
        where: {
          externalId: editCalendarDto.externalId,
        },
        data: {
          startDate: editCalendarDto.startDate
            ? new Date(editCalendarDto.startDate)
            : localEvent.startDate,
          endDate: editCalendarDto.endDate
            ? new Date(editCalendarDto.endDate)
            : localEvent.endDate,
          application: {
            connect: { id: editCalendarDto.applicationId },
          },
          isAttended: editCalendarDto.isAttended,
          updatedAt: new Date(Date.now()),
        },
      });

      if (user.access_token) {
        try {
          const oauth2Client = new google.auth.OAuth2(
            this.config.get('GOOGLE_CLIENT_ID'),
            this.config.get('GOOGLE_CLIENT_SECRET'),
          );

          oauth2Client.setCredentials({
            access_token: user.access_token,
            // expiry_date: user.expires_in,
          });

          if (
            oauth2Client.getTokenInfo(oauth2Client.credentials.access_token)
          ) {
            const calendar = google.calendar({
              version: 'v3',
              auth: oauth2Client,
            });

            await calendar.events.update({
              calendarId: user.calendarId,
              eventId: updatedLocalEvent.googleCalenderEventId,
              requestBody: {
                start: {
                  date: updatedLocalEvent.startDate.toISOString().split('T')[0],
                  timeZone: 'UTC', // Optionally, specify the time zone
                },
                end: {
                  date: updatedLocalEvent.endDate.toISOString().split('T')[0],
                  timeZone: 'UTC', // Optionally, specify the time zone
                },
                reminders: {
                  useDefault: true,
                },
                colorId: updatedLocalEvent.googleColor,
              },
            });
          }
        } catch (error) {
          console.error('Google Calendar API Error: ', error);
          // throw new HttpException(
          //   'Google Calendar API Error',
          //   HttpStatus.ACCEPTED,
          // );
        }
      }
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
}
