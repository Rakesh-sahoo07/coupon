import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { EmailService } from './email.service';
import { SendCouponEmailDto } from './dto/send-coupon-email.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('email')
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @UseGuards(JwtAuthGuard)
  @Post('send-coupon')
  async sendCouponEmail(@Body() sendCouponEmailDto: SendCouponEmailDto) {
    const success = await this.emailService.sendCouponEmail(sendCouponEmailDto);
    return { success };
  }
}