import { Injectable } from '@nestjs/common';
import mongoose, { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Block, BlockDocument } from './schema/block.schema';
import { Listing, ListingDocument } from './schema/listing.schema';
import { Cache, CacheDocument } from './schema/cache.schema';

export interface Filter {
  year?: number;
  groupBy?: string;
  country?: string;
}

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

  async getData(filter: Filter) {
    const cacheData = await this.cacheModel.findOne({
      type: 'bookingsByFilter',
      filter,
    });

    if (cacheData) {
      return cacheData.data;
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
        $match: {
          ...(filter.country
            ? { 'listings.address.country': filter.country }
            : {}),
          startDate: { $gte: new Date(filter.year, 0, 1) },
          endDate: { $lte: new Date(filter.year, 11, 31) },
        },
      },
      {
        $group: {
          _id: `$listings.address.${filter.groupBy}`,
          lat: { $first: '$listings.address.lat' },
          lng: { $first: '$listings.address.lng' },
          count: { $count: {} },
          sum: { $sum: '$reservation.money.hostPayout' },
        },
      },
    ]);

    await this.cacheModel.create({
      _id: new mongoose.Types.ObjectId(),
      type: 'bookingsByFilter',
      filter,
      data: data,
    });

    return data;
  }
}
