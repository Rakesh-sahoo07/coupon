import { Controller, Get, Post, Body, Patch, Param, UseGuards, Request } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { AddWalletDto } from './dto/add-wallet.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Request() req) {
    const user = await this.usersService.findById(req.user.sub);
    // Don't return password
    const { password, ...result } = user.toObject();
    return result;
  }

  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  async updateProfile(@Request() req, @Body() updateProfileDto: UpdateProfileDto) {
    const user = await this.usersService.updateProfile(
      req.user.sub,
      updateProfileDto.firstName,
      updateProfileDto.lastName,
    );
    const { password, ...result } = user.toObject();
    return result;
  }

  @UseGuards(JwtAuthGuard)
  @Post('wallet')
  async addWalletAddress(@Request() req, @Body() addWalletDto: AddWalletDto) {
    const user = await this.usersService.addWalletAddress(
      req.user.sub,
      addWalletDto.walletAddress,
    );
    const { password, ...result } = user.toObject();
    return result;
  }
}