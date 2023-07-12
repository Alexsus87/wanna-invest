import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Block, BlockDocument } from './schema/block.schema';
import { Listing, ListingDocument } from './schema/listing.schema';

@Injectable()
export class AppService {
  constructor(
    @InjectModel(Listing.name)
    protected readonly listingModel: Model<ListingDocument>,
    @InjectModel(Block.name)
    protected readonly blockModel: Model<BlockDocument>,
  ) {}

  async getData() {
    const data = await this.blockModel
      .aggregate([
        {
          $lookup: {
            from: 'listings',
            localField: 'listingId',
            foreignField: '_id',
            as: 'listings',
          },
        },
        {
          $unwind: '$listings',
        },
        {
          $group: {
            _id: {
              city: '$listings.address.city',
            },
            count: { $sum: 1 },
          },
        },
      ])
      .exec();
    return data;
  }
}
