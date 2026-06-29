import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Wallet, WalletDocument } from './schemas/wallet.schema';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { UpdateWalletDto } from './dto/update-wallet.dto';
import { WalletStatus } from '../../common/enums/status.enum';
import { CloudinaryService } from '../../uploads/cloudinary/cloudinary.service';

@Injectable()
export class WalletsService {
  constructor(
    @InjectModel(Wallet.name) private walletModel: Model<WalletDocument>,
    private cloudinaryService: CloudinaryService,
  ) {}

  async create(dto: CreateWalletDto, qrFile?: Express.Multer.File) {
    let qrCodeImage: string | undefined;
    if (qrFile) {
      const result = await this.cloudinaryService.uploadImage(qrFile, 'wallet-qr-codes');
      qrCodeImage = result.secure_url;
    }
    return this.walletModel.create({ ...dto, qrCodeImage });
  }

  async update(id: string, dto: UpdateWalletDto, qrFile?: Express.Multer.File) {
    const wallet = await this.walletModel.findById(id);
    if (!wallet) throw new NotFoundException('Wallet not found');

    if (qrFile) {
      const result = await this.cloudinaryService.uploadImage(qrFile, 'wallet-qr-codes');
      wallet.qrCodeImage = result.secure_url;
    }

    Object.assign(wallet, dto);
    await wallet.save();
    return wallet;
  }

  // Public — only active wallets, for users picking where to send crypto
  async findAllActive() {
    return this.walletModel.find({ status: WalletStatus.ACTIVE }).sort({ coinName: 1 });
  }

  // Admin — sees all, including disabled
  async findAllAdmin() {
    return this.walletModel.find().sort({ createdAt: -1 });
  }

  async findOne(id: string) {
    const wallet = await this.walletModel.findById(id);
    if (!wallet) throw new NotFoundException('Wallet not found');
    return wallet;
  }

  async disable(id: string) {
    const wallet = await this.walletModel.findByIdAndUpdate(
      id,
      { status: WalletStatus.DISABLED },
      { new: true },
    );
    if (!wallet) throw new NotFoundException('Wallet not found');
    return wallet;
  }
}