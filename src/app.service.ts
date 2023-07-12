import { Injectable } from '@nestjs/common';
import mongoose, { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Block, BlockDocument } from './schema/block.schema';
import { Listing, ListingDocument } from './schema/listing.schema';
import { Cache, CacheDocument } from './schema/cache.schema';

@Injectable()
export class AppService {
  constructor(
    @InjectModel(Listing.name)
    protected readonly listingModel: Model<ListingDocument>,
    @InjectModel(Block.name)
    protected readonly blockModel: Model<BlockDocument>,
    @InjectModel(Cache.name)
    protected readonly cacheModel: Model<CacheDocument>,
  ) {}

  async getData() {
    const cacheData = await this.cacheModel.findOne({
      type: 'bookingsCountByCity',
    });

    if (cacheData) {
      return cacheData;
    }

    const data = await this.blockModel.aggregate([
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
    ]);

    await this.cacheModel.create({
      _id: new mongoose.Types.ObjectId(),
      type: 'bookingsCountByCity',
      data: data,
    });

    return data;
  }
}
