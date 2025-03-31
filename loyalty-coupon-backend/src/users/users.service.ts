import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../schemas/user.schema';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async create(email: string, password: string, firstName?: string, lastName?: string, walletAddress?: string): Promise<UserDocument> {
    const existingUser = await this.userModel.findOne({ email }).exec();
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    const newUser = new this.userModel({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      walletAddresses: walletAddress ? [walletAddress] : [],
    });

    return newUser.save();
  }

  async findByEmail(email: string): Promise<UserDocument> {
    const user = await this.userModel.findOne({ email }).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findById(id: string): Promise<UserDocument> {
    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async addWalletAddress(userId: string, walletAddress: string): Promise<UserDocument> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.walletAddresses.includes(walletAddress)) {
      user.walletAddresses.push(walletAddress);
      await user.save();
    }

    return user;
  }

  async updateProfile(userId: string, firstName?: string, lastName?: string): Promise<UserDocument> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;

    return user.save();
  }
}