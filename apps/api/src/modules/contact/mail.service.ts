import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer, { type Transporter } from 'nodemailer';
import type { ContactInput } from '@myself/shared';

/**
 * 联系表单邮件通知（可选）。未配置 SMTP 时静默跳过，
 * 留言本身始终先落库，邮件失败不影响提交结果。
 */
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter?: Transporter;

  constructor(private readonly config: ConfigService) {}

  async notify(input: ContactInput): Promise<void> {
    const host = this.config.get<string>('SMTP_HOST');
    const to = this.config.get<string>('CONTACT_TO');
    if (!host || !to) return;

    const port = Number(this.config.get<string>('SMTP_PORT') ?? '587');
    const user = this.config.get<string>('SMTP_USER');
    const pass = this.config.get<string>('SMTP_PASS');

    this.transporter ??= nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      ...(user && pass ? { auth: { user, pass } } : {}),
    });

    try {
      await this.transporter.sendMail({
        from: user ?? `no-reply@${host}`,
        to,
        replyTo: input.email,
        subject: `[站点留言] ${input.subject || `${input.name} 的新留言`}`.slice(0, 120),
        text: [
          `称呼：${input.name}`,
          `邮箱：${input.email}`,
          `主题：${input.subject || '（未填写）'}`,
          '',
          input.content,
        ].join('\n'),
      });
    } catch (error) {
      this.logger.warn(`留言通知邮件发送失败: ${String(error)}`);
    }
  }
}
