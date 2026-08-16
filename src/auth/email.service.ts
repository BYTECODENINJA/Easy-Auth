import { Injectable } from '@nestjs/common';
import { Resend } from 'resend';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailService {
  private resend: Resend;

  constructor(private readonly configService: ConfigService) {
    this.resend = new Resend(this.configService.get<string>('RESEND_API_KEY'));
  }

  async sendVerificationEmail(email: string, token: string) {
    const appUrl = this.configService.get<string>('FRONTEND_URL');
    const verificationUrl = `${appUrl}/api/auth/verify-email?token=${token}`;

    await this.resend.emails.send({
      from: 'onboarding@resend.dev',
      to: email,
      subject: 'Email Verification',
      html: `
<h1>Welcome! please verify your email </h1>
<p>Click the link below to verify your email address. This link expires in 24hours.</p>
<a href="${verificationUrl}">Verify Email</a>
<p>If you didn't create an account, you can ignore this message.</p>
<p>Please do not share the verification link with anyone.</p>
`,
    });
  }

  async sendResetPasswordEmail(email: string, token: string) {
    const appUrl = this.configService.get<string>('FRONTEND_URL');
    const resetPasswordUrl = `${appUrl}/api/auth/reset-password?token=${token}`;

    await this.resend.emails.send({
      from: 'onboarding@resend.dev',
      to: email,
      subject: 'Your password Reset',
      html: `
      <h2>You have requested to reset your password</h2>
      <p>Click the link below to reset your password. This link expires in 1 hour.</p>
      <a href="${resetPasswordUrl}">Reset Password</a>
      <p>If you didn't request a password request, you can ignore this email.</p>
      `,
    });
  }
}
