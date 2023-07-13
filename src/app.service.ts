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
import { State, StateDocument } from './schema/state.schema';
import { BlockDocumentV3, BlockV3 } from './schema/block-v3.schema';

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
    @InjectModel(BlockV3.name)
    protected readonly blockModel: Model<BlockDocumentV3>,
    @InjectModel(PropertiesData.name)
    protected readonly propertyModel: Model<PropertiesDataDocument>,
    @InjectModel(State.name)
    protected readonly stateModel: Model<StateDocument>,
    @InjectModel(Cache.name)
    protected readonly cacheModel: Model<CacheDocument>,

    protected readonly roiService: RoiService,
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

    /*if (cacheData) {
      return cacheData.data;
    }*/

    let data = await this.blockModel.aggregate([
      {
        $match: {
          ...(filter.country
            ? { 'listing.address.country': filter.country }
            : {}),
          startDate: { $gte: new Date(filter.year, 0, 1) },
          endDate: { $lte: new Date(filter.year, 11, 31) },
        },
      },
      {
        $group: {
          _id: `$listing.address.${filter.groupBy}`,
          country: { $first: '$listing.address.country' },
          city: { $first: '$listing.address.city' },
          state: { $first: '$listing.address.state' },
          lat: { $first: '$listing.address.lat' },
          lng: { $first: '$listing.address.lng' },
          count: { $sum: 1 },
          sum: { $sum: '$reservation.money.hostPayout' },
        },
      },
    ]);

    if (filter.country === 'United States' && filter.groupBy === 'city') {
      const [properties, states] = await Promise.all([
        this.propertyModel.aggregate([
          {
            $group: {
              _id: 'city',
              count: { $count: {} },
              sum: { $sum: '$price' },
            },
          },
        ]),
        this.stateModel.find(),
      ]);
      const propertiesMap = properties.reduce((map, row) => {
        return map.set(row._id, Math.round(row.sum / row.count));
      }, new Map());
      const statesMap = states.reduce((map, row) => {
        return map.set(row.state, row.price);
      }, new Map());
      console.log(statesMap);

      data = data.map((i) => {
        //get property cost by city here
        const averagePropertyCost =
          propertiesMap.get(i._id) || statesMap.get(i.state) || 400000;
        const completeMortgageData = {
          propertyCost: averagePropertyCost,
          ...mortgageData,
        };

        const avgSum = i.sum / i.totalListingsCount;
        const isValidMortgageData =
          this.roiService.isValidMortgageData(completeMortgageData);
        i.cashFlow = this.roiService.calculateCashFlow(
          avgSum,
          isValidMortgageData ? completeMortgageData : undefined,
        );
        i.capRate = this.roiService.calculateCapRate(
          avgSum,
          averagePropertyCost,
        );
        i.cashOnCash = isValidMortgageData
          ? this.roiService.calculateCashOnCashReturn(
              avgSum,
              completeMortgageData,
            )
          : undefined;
        i.averagePropertyCost = averagePropertyCost;
        i.payback = +(averagePropertyCost / avgSum).toFixed(1);

        return i;
      });
    }

    const filteredData = data
      .filter((item) => item._id !== null)
      .map(({ totalListings, ...rest }) => rest);

    await this.cacheModel.create({
      _id: new mongoose.Types.ObjectId(),
      type: 'bookingsByFilter',
      filter,
      data: filteredData,
    });

    return filteredData;
  }
}
