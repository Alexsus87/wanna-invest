import mongoose, { Model, Types } from 'mongoose';
import * as fs from 'fs';
import { Injectable } from '@nestjs/common';
import * as process from 'process';
import { Listing, ListingSchema } from '../schema/listing.schema';
import { Block, BlockSchema } from '../schema/block.schema';
import { BlockSchemaV3, BlockV3 } from '../schema/block-v3.schema';

@Injectable()
export class MergeDataTask {
  async run() {
    const devConnection = await mongoose.createConnection(
      process.env.MONGO_CONNECTION_STRING,
    );

    const devListingsModel = devConnection.model(
      'listings',
      ListingSchema,
      'listings_v2',
    );
    const devBlocksModel = devConnection.model(
      'blocks',
      BlockSchema,
      'blocks_v2',
    );
    const devBlocksV3Model = devConnection.model(
      'listings',
      BlockSchemaV3,
      'blocks_v3',
    );

    const offsetFile = fs.readFileSync(
      __dirname + '/offset-merge.json',
      'utf8',
    );
    let { lastId, page } = JSON.parse(offsetFile);

    console.log(`loaded offset from file lastId: ${lastId}, page: ${page}`);

    const limit = 1000;

    let shouldContinue = true;

    while (shouldContinue) {
      console.time('dbsave');

      const data = await devBlocksModel.find(
        {
          ...(lastId
            ? { _id: { $gt: new mongoose.Types.ObjectId(lastId) } }
            : {}),
        },
        {},
        { limit, sort: [{ _id: 1 }] },
      );

      console.log(
        `received data lastId: ${lastId}, page: ${page}, size: ${data.length}`,
      );

      if (data.length < 1000) {
        shouldContinue = false;
      }

      const listingIds = Array.from(
        new Set(data.map((item) => item.listingId.toString())),
      );

      const listings = await devListingsModel.find({
        _id: {
          $in: listingIds.map((id) => new mongoose.Types.ObjectId(id)),
        },
      });
      const listingsMap = new Map<string, Listing>();
      listings.forEach((listing) => {
        listingsMap.set(listing._id.toString(), listing);
      });

      console.log(
        `saving data, lastId: ${lastId}, page: ${page}, size: ${data.length}`,
      );

      try {
        const dataToInsert = data
          .map((item): BlockV3 => {
            const listing = listingsMap.get(item.listingId.toString());

            if (!listing) {
              console.log('Listing not found', item.listingId.toString());
            }
            return {
              ...item.toObject(),
              listing,
            };
          })
          .filter((item) => !!item.listing);

        await devBlocksV3Model.insertMany(dataToInsert, { ordered: false });

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
        __dirname + '/offset-merge.json',
        JSON.stringify({ lastId, page }),
      );

      console.timeEnd('dbsave');
    }
    console.log(`task finished`);
  }
}
