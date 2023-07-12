import {
  PropertiesData,
  PropertiesDataDocument,
} from '../schema/properties-data.schema';
import mongoose, { Model, Types } from 'mongoose';
import * as fs from 'fs';
import { InjectModel } from '@nestjs/mongoose';
import { Injectable } from '@nestjs/common';
import * as process from 'process';
import { randomUUID } from 'crypto';
import { chunk } from 'lodash';
import {
  Listing,
  ListingDocument,
  ListingSchema,
} from '../schema/listing.schema';

@Injectable()
export class MongoImportTask {
  async run() {
    const prodConnection = await mongoose.createConnection(
      'mongodb://bohdan_onyshchenko:rXXgv2XEvqrt@dynamic-pricing-shard-00-00.jqmo9.mongodb.net:27017,dynamic-pricing-shard-00-01.jqmo9.mongodb.net:27017,dynamic-pricing-shard-00-02.jqmo9.mongodb.net:27017/dpt-data?ssl=true&replicaSet=atlas-rpqfls-shard-0',
      {
        authSource: 'admin',
      },
    );
    const devConnection = await mongoose.createConnection(
      process.env.MONGO_CONNECTION_STRING,
    );

    const prodListingsModel = prodConnection.model('listings', ListingSchema);
    const devListingsModel = devConnection.model('listings', ListingSchema);

    const offsetFile = fs.readFileSync(__dirname + '/offset.txt', 'utf8');
    let offset = parseInt(offsetFile, 10);

    console.log('loaded offset from file', offset);

    const limit = 1000;

    let shouldContinue = true;

    while (shouldContinue) {
      const data = await prodListingsModel.find(
        {},
        {
          address: true,
          _id: true,
          prices: true,
          title: true,
          timezone: true,
          createdAt: true,
          updatedAt: true,
        },
        { limit: 1000, skip: offset },
      );
      console.log(`received data offset ${offset}, size: ${data.length}`);

      if (data.length < 1000) {
        shouldContinue = false;
      }

      console.log(`saving data, offset ${offset}, size: ${data.length}`);

      try {
        await devListingsModel.insertMany(data, { ordered: false });

        console.log(`saved data, offset ${offset}, size: ${data.length}`);
      } catch (error) {
        console.log(
          `error saving data, error count: ${error.writeErrors.length}, inserted count: ${error.insertedDocs.length}, message: ${error.message}`,
        );
      }

      offset += 1000;
      fs.writeFileSync(__dirname + '/offset.txt', offset.toString());
    }

    console.log(`task finished`);
  }
}
