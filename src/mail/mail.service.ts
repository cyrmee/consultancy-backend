import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
  constructor(
    private readonly mailerService: MailerService,
    private readonly config: ConfigService,
  ) {}

  async sendResetPasswordToken(
    email: string,
    resetPasswordToken: string,
  ): Promise<void> {
    const url = `${await this.config.get('FRONTEND_URL')}/auth/reset-password/${resetPasswordToken}`;

    const emailBody = `You have requested a password reset for your account.\nPlease click on the following link to reset your password:\n\n${url}\n\nThis link will expire in 10 minutes.`;

    await this.mailerService.sendMail({
      to: email,
      subject: 'Password Reset Request',
      text: emailBody,
    });
  }

  async sendResetPasswordTokenMobile(
    email: string,
    resetPasswordToken: string,
  ): Promise<void> {
    const emailBody = `You have requested an OTP for your account.\n\nToken: ${resetPasswordToken}\n\nThis code will expire in 10 minutes.`;

    await this.mailerService.sendMail({
      to: email,
      subject: 'Password Reset Request',
      text: emailBody,
    });
  }

  async sendOTP(email: string, otp: string): Promise<void> {
    const emailBody = `You have requested an OTP for your account.\n\nOTP: ${otp}\n\nThis code will expire in 10 minutes.`;

    await this.mailerService.sendMail({
      to: email,
      subject: 'Consultancy OTP',
      text: emailBody,
    });
  }

  async sendPasswordViaEmail(email: string, password: string): Promise<void> {
    const emailBody = `Your password is: ${password}\n\nPlease keep this password in a safe place.\n\nNo one knows this password except you, however it's best if you change it immediately.\n\nThank you,\nConsultancy Team\n\nThis email was sent automatically. Please do not reply to this email.`;

    await this.mailerService.sendMail({
      to: email,
      subject: 'Consultancy Credentials',
      text: emailBody,
    });
  }

  async sendEmployeePasswordViaEmail(
    email: string,
    password: string,
  ): Promise<void> {
    const emailBody = `Your password is: ${password}\n\nPlease keep this password in a safe place.\n\nOnly your admin knows this password, it's best if you change it immediately.\n\nThank you,\nConsultancy Team\n\nThis email was sent automatically. Please do not reply to this email.`;

    await this.mailerService.sendMail({
      to: email,
      subject: 'Consultancy Credentials',
      text: emailBody,
    });
  }
}
