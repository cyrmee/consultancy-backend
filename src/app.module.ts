import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { StudentModule } from './student/student.module';
import { CommonModule } from './common/common.module';
import { CommentModule } from './comment/comment.module';
import { EnglishTestModule } from './english-test/english-test.module';
import { DepositModule } from './deposit/deposit.module';
import { ApplicationService } from './application/application.service';
import { ApplicationModule } from './application/application.module';
import { EmployeeModule } from './employee/employee.module';
import { NotificationModule } from './notification/notification.module';
import { PostModule } from './post/post.module';
import { RelationModule } from './relation/relation.module';
import { EducationBackgroundModule } from './education-background/education-background.module';
import { ChatModule } from './chat/chat.module';
import { MessageModule } from './message/message.module';
import { ConversationModule } from './conversation/conversation.module';
import { UnitedStatesVisaModule } from './visa/united-states-visa/united-states-visa.module';
import { CanadaVisaModule } from './visa/canada-visa/canada-visa.module';
import { AuditModule } from './audit/audit.module';
import { MailModule } from './mail/mail.module';
import { CalendarModule } from './calendar/calendar.module';
import { CacheModule } from '@nestjs/cache-manager';
import { AdditionalStudentFilesModule } from './additional-student-files/additional-student-files.module';
import { AdModule } from './ad/ad.module';
import { DashboardModule } from './dashboard/dashboard.module';

@Module({
  imports: [
    CacheModule.registerAsync({
      useFactory: () => ({}),
      isGlobal: true,
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      // envFilePath: ['.env', '.env.development'], // load .env file
    }),
    ApplicationModule,
    AuditModule,
    AuthModule,
    ChatModule,
    CalendarModule,
    ConversationModule,
    CanadaVisaModule,
    CommonModule,
    CommentModule,
    DepositModule,
    EducationBackgroundModule,
    EmployeeModule,
    EnglishTestModule,
    MailModule,
    MessageModule,
    NotificationModule,
    PostModule,
    PrismaModule,
    RelationModule,
    StudentModule,
    UnitedStatesVisaModule,
    UserModule,
    AdditionalStudentFilesModule,
    AdModule,
    DashboardModule,
  ],
  providers: [ApplicationService],
})
export class AppModule {}
