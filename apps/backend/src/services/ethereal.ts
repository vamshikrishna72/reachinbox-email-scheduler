import nodemailer, { Transporter } from 'nodemailer';

class EtherealService {
  private transporter: Transporter | null = null;
  private testAccount: nodemailer.TestAccount | null = null;

  private async getTransporter(): Promise<Transporter> {
    if (!this.transporter) {
      this.testAccount = await nodemailer.createTestAccount();
      this.transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: this.testAccount.user,
          pass: this.testAccount.pass,
        },
      });
      console.log(`[Ethereal] Initialized test SMTP account: ${this.testAccount.user}`);
    }
    return this.transporter;
  }

  public async sendEmail({
    to,
    subject,
    body,
  }: {
    to: string;
    subject: string;
    body: string;
  }): Promise<{ messageId: string; etherealUrl: string | false }> {
    const transporter = await this.getTransporter();

    const info = await transporter.sendMail({
      from: '"ReachInbox Outreach Engine" <noreply@reachinbox.ai>',
      to,
      subject,
      html: body,
      text: body.replace(/<[^>]*>?/gm, ''),
    });

    const etherealUrl = nodemailer.getTestMessageUrl(info);
    return {
      messageId: info.messageId,
      etherealUrl,
    };
  }
}

export const etherealService = new EtherealService();
