import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { SendCouponEmailDto } from './dto/send-coupon-email.dto';
import { getCouponEmailTemplate } from './templates/coupon-email.template';

@Injectable()
export class EmailService {
  private readonly transporter: nodemailer.Transporter;
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: configService.get<string>('EMAIL_HOST'),
      port: configService.get<number>('EMAIL_PORT'),
      secure: configService.get<number>('EMAIL_PORT') === 465,
      auth: {
        user: configService.get<string>('EMAIL_USER'),
        pass: configService.get<string>('EMAIL_PASSWORD'),
      },
    });
  }

  async sendCouponEmail(dto: SendCouponEmailDto): Promise<boolean> {
    try {
      const { recipientEmail, couponCode, discount, organizationName, description, expiresAt, redeemUrl } = dto;
      
      const defaultRedeemUrl = `${this.configService.get<string>('FRONTEND_URL', 'http://localhost:5173')}/redeem/${couponCode}`;
      
      const mailOptions = {
        from: this.configService.get<string>('EMAIL_FROM'),
        to: recipientEmail,
        subject: `Your ${discount} Coupon from ${organizationName}`,
        html: getCouponEmailTemplate({
          couponCode,
          discount,
          organizationName,
          description: description || `Use this coupon for ${discount} at ${organizationName}`,
          expiresAt,
          redeemUrl: redeemUrl || defaultRedeemUrl,
        }),
      };

      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(`Email sent: ${info.messageId}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send email: ${error.message}`, error.stack);
      return false;
    }
  }
}