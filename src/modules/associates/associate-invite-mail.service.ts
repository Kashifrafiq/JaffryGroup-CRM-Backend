import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

type InviteMailInput = {
  to: string;
  inviteLink: string;
};

@Injectable()
export class AssociateInviteMailService {
  private readonly logger = new Logger(AssociateInviteMailService.name);
  private transporter?: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>('SMTP_HOST')?.trim();
    const portRaw = this.configService.get<string>('SMTP_PORT');
    const user = this.configService.get<string>('SMTP_USER')?.trim();
    const pass = this.configService.get<string>('SMTP_PASS')?.trim();

    if (!host || !portRaw || !user || !pass) {
      this.logger.warn('SMTP credentials are incomplete; invite emails cannot be sent.');
      return;
    }

    this.logger.log(
      `SMTP configured: ${user}@${host}:${portRaw} (password length ${pass.length})`,
    );

    const port = Number(portRaw);
    const secureFlag = this.configService.get<string>('SMTP_SECURE')?.trim().toLowerCase();
    const secure =
      secureFlag === 'true' || secureFlag === '1' || secureFlag === 'yes' || port === 465;

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
      ...(port === 587 && !secure ? { requireTLS: true } : {}),
    });
  }

  async sendAssociateInvite(input: InviteMailInput): Promise<void> {
    const from = this.configService.get<string>('SMTP_FROM')?.trim();
    if (!from) {
      throw new Error('SMTP_FROM is required to send invite emails');
    }
    if (!this.transporter) {
      throw new Error('SMTP transport is not configured');
    }

    await this.transporter.sendMail({
      from,
      to: input.to,
      subject: 'Jaffry Group invited you to join CRM',
      text: [
        'Jaffry Group has invited you to join their CRM.',
        '',
        'Use the link below to set your password and complete your profile:',
        input.inviteLink,
      ].join('\n'),
      html: [
        '<p>Jaffry Group has invited you to join their CRM.</p>',
        '<p>Use the link below to set your password and complete your profile:</p>',
        `<p><a href="${input.inviteLink}">${input.inviteLink}</a></p>`,
      ].join(''),
    });
  }
}
