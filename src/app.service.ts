import { Injectable } from '@nestjs/common';
import mongoose, { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Block, BlockDocument } from './schema/block.schema';
import { Listing, ListingDocument } from './schema/listing.schema';
import { Cache, CacheDocument } from './schema/cache.schema';
import {
  PropertiesData,
  PropertiesDataDocument,
} from './schema/properties-data.schema';
import { RoiService } from './roi.service';

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
    @InjectModel(PropertiesData.name)
    protected readonly propertyModel: Model<PropertiesDataDocument>,
    @InjectModel(Cache.name)
    protected readonly cacheModel: Model<CacheDocument>,

    protected readonly roiService: RoiService,
  ) {}

  async getData(filter: Filter) {
    const cacheData = await this.cacheModel.findOne({
      type: 'bookingsByFilter',
      filter,
    });

    /*if (cacheData) {
      return cacheData.data;
    }*/

    let data = await this.blockModel.aggregate([
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

    if (filter.country === 'United States' && filter.groupBy === 'city') {
      const properties = (
        await this.blockModel.aggregate([
          {
            $group: {
              _id: 'city',
              count: { $count: {} },
              sum: { $sum: '$price' },
            },
          },
        ])
      ).reduce((map, row) => {
        return map.set(row._id, Math.round(row.sum / row.count));
      }, new Map());

      data = data.map((row) => {
        const averagePropertyPriceForCity = properties.get(row._id);

        if (averagePropertyPriceForCity) {
          row.capRate = this.roiService.calculateCapRate(
            row.sum,
            averagePropertyPriceForCity,
          );
          row.cashOnCash = this.roiService.cashOnCashReturn(
            row.sum,
            averagePropertyPriceForCity,
          );
          row.cashFlow = this.roiService.calculateCashFlow(
            row.sum,
            averagePropertyPriceForCity,
          );
          row.payback = averagePropertyPriceForCity / row.sum;
        }

        return row;
      });
    }

    await this.cacheModel.create({
      _id: new mongoose.Types.ObjectId(),
      type: 'bookingsByFilter',
      filter,
      data: data,
    });

    return data;
  }
}
