import { IsString, IsNotEmpty } from 'class-validator';

export class AddWalletDto {
  @IsString()
  @IsNotEmpty()
  walletAddress: string;
}