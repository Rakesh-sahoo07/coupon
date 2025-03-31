import { IsEmail, IsNotEmpty, IsString, IsOptional, IsUrl, IsDate } from 'class-validator';

export class SendCouponEmailDto {
  @IsEmail()
  @IsNotEmpty()
  recipientEmail: string;

  @IsString()
  @IsNotEmpty()
  couponCode: string;

  @IsString()
  @IsNotEmpty()
  discount: string;

  @IsString()
  @IsNotEmpty()
  organizationName: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsNotEmpty()
  expiresAt: string;

  @IsUrl()
  @IsOptional()
  redeemUrl?: string;
}