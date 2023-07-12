import mongoose, { Types } from 'mongoose';
import * as fs from 'fs';
import { Injectable } from '@nestjs/common';
import * as process from 'process';
import { BlockSchema } from '../schema/block.schema';

@Injectable()
export class MongoImportBlockTask {
  async run() {
    const prodConnection = await mongoose.createConnection(
      process.env.MONGO_CONNECTION_STRING_PROD,
      {
        authSource: 'admin',
      },
    );
    const devConnection = await mongoose.createConnection(
      process.env.MONGO_CONNECTION_STRING,
    );

    const prodBlocksModel = prodConnection.model(
      'blocks',
      BlockSchema,
      'blocks',
    );
    const devBlocksModel = devConnection.model(
      'blocks_v2',
      BlockSchema,
      'blocks_v2',
    );

    const offsetFile = fs.readFileSync(
      __dirname + '/offset-blocks.json',
      'utf8',
    );
    let { lastId, page } = JSON.parse(offsetFile);

    console.log(`loaded offset from file lastId: ${lastId}, page: ${page}`);

    const limit = 1000;

    let shouldContinue = true;

    while (shouldContinue) {
      console.time('dbsave');

      const data = await prodBlocksModel.find(
        {
          ...(lastId
            ? { _id: { $gt: new mongoose.Types.ObjectId(lastId) } }
            : {}),
        },
        {},
        { limit, sort: { _id: 1 } },
      );
      console.log(
        `received data lastId ${lastId}, page: ${page}, size: ${data.length}`,
      );

      if (data.length < limit) {
        shouldContinue = false;
      }

      console.log(
        `saving data, lastId ${lastId}, page: ${page}, size: ${data.length}`,
      );

      try {
        const filtered = data.filter(
          (item) => !!item.reservation?.money?.hostPayout,
        );

        console.log(`skipped count ${data.length - filtered.length}`);

        await devBlocksModel.insertMany(filtered, { ordered: false });

        console.log(
          `saved data, offset lastId ${lastId}, page: ${page}, size: ${data.length}`,
        );
      } catch (error) {
        console.log(
          `error saving data, error count: ${error.writeErrors.length}, inserted count: ${error.insertedDocs.length}, message: ${error.message}`,
        );
      }

      lastId = data[data.length - 1]._id;
      page++;

      console.log('new lastId', lastId);

      fs.writeFileSync(
        __dirname + '/offset-blocks.json',
        JSON.stringify({ lastId, page }),
      );

      console.timeEnd('dbsave');
    }

    console.log(`task finished`);
  }
}
