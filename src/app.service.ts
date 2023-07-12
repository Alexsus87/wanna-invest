import { Injectable } from '@nestjs/common';
import mongoose, { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Block, BlockDocument } from './schema/block.schema';
import { Listing, ListingDocument } from './schema/listing.schema';
import { Cache, CacheDocument } from './schema/cache.schema';
import { RoiService } from './roi.service';

export interface Filter {
  year?: number;
  groupBy?: string;
  country?: string;
  interestRate?: number;
  mortgageYears?: number;
  investmentAmount?: number;
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
    private readonly roiService: RoiService,
  ) {}

  async getData(filter: Filter) {
    const mortgageData = {
      years: filter.mortgageYears,
      interestRate: filter.interestRate,
      downPayment: filter.investmentAmount,
    };

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
    const mappedData = data.map((i) => {
      //get property cost by city here
      const averagePropertyCost = 400000;
      const completeMortgageData = {
        propertyCost: averagePropertyCost,
        ...mortgageData,
      };

      const isValidMortgageData =
        this.roiService.isValidMortgageData(completeMortgageData);
      i.cashFlow = this.roiService.calculateCashFlow(
        i.sum,
        isValidMortgageData ? completeMortgageData : undefined,
      );
      i.capRate = this.roiService.calculateCapRate(i.sum, averagePropertyCost);
      i.cashOnCash = isValidMortgageData
        ? this.roiService.calculateCashOnCashReturn(i.sum, completeMortgageData)
        : undefined;

      return i;
    });

    await this.cacheModel.create({
      _id: new mongoose.Types.ObjectId(),
      type: 'bookingsByFilter',
      filter,
      data: mappedData,
    });

    return mappedData.filter((item) => item._id !== null);
  }
}
