import nodemailer from "nodemailer";
import { env } from "@/shared/env";

export type MailAttachment = { filename: string; content: Buffer; contentType: string };
export type MailMessage = { to: string; subject: string; text: string; html: string; attachments?: MailAttachment[] };

/** Port de sortie : on peut brancher SendGrid, Brevo, etc. en implémentant cette interface. */
export interface Mailer {
  send(message: MailMessage): Promise<void>;
}

class SmtpMailer implements Mailer {
  private transport = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
  });
  async send(m: MailMessage) {
    await this.transport.sendMail({ from: env.MAIL_FROM, ...m });
  }
}

/** Sans SMTP configuré : l'e-mail est seulement journalisé (visible dans Admin > E-mails). */
class ConsoleMailer implements Mailer {
  async send(m: MailMessage) {
    console.info(`[mail:simulé] à=${m.to} objet="${m.subject}"`);
  }
}

export const getMailer = (): Mailer => (env.SMTP_HOST ? new SmtpMailer() : new ConsoleMailer());
export const isSmtpConfigured = () => Boolean(env.SMTP_HOST);
