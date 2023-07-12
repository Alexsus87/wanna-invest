import mongoose, { Model, Types } from 'mongoose';
import * as fs from 'fs';
import { Injectable } from '@nestjs/common';
import * as process from 'process';
import { ListingSchema } from '../schema/listing.schema';

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
    const devListingsModel = devConnection.model(
      'listings',
      ListingSchema,
      'listings_v2',
    );

    const offsetFile = fs.readFileSync(
      __dirname + '/offset-listings.json',
      'utf8',
    );
    let { lastId, page } = JSON.parse(offsetFile);

    console.log(`loaded offset from file lastId: ${lastId}, page: ${page}`);

    const limit = 1000;

    let shouldContinue = true;

    while (shouldContinue) {
      const data = await prodListingsModel.find(
        {
          ...(lastId
            ? { _id: { $gt: new mongoose.Types.ObjectId(lastId) } }
            : {}),
        },
        {
          address: true,
          _id: true,
          prices: true,
          title: true,
          timezone: true,
          createdAt: true,
          updatedAt: true,
        },
        { limit, sort: { _id: 1 } },
      );
      console.log(
        `received data lastId: ${lastId}, page: ${page}, size: ${data.length}`,
      );

      if (data.length < 1000) {
        shouldContinue = false;
      }

      console.log(
        `saving data, lastId: ${lastId}, page: ${page}, size: ${data.length}`,
      );

      try {
        await devListingsModel.insertMany(data, { ordered: false });

        console.log(
          `saved data, offset lastId: ${lastId}, page: ${page}, size: ${data.length}`,
        );
      } catch (error) {
        console.log(
          `error saving data, error count: ${error.writeErrors.length}, inserted count: ${error.insertedDocs.length}, message: ${error.message}`,
        );
      }

      page += 1;
      lastId = data[data.length - 1]._id;
      fs.writeFileSync(
        __dirname + '/offset-listings.json',
        JSON.stringify({ lastId, page }),
      );
    }

    console.log(`task finished`);
  }
}
