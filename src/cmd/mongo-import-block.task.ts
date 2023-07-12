import mongoose from 'mongoose';
import * as fs from 'fs';
import { Injectable } from '@nestjs/common';
import * as process from 'process';
import { BlockSchema } from '../schema/block.schema';

@Injectable()
export class MongoImportBlockTask {
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

    const prodBlocksModel = prodConnection.model('blocks', BlockSchema);
    const devBlocksModel = devConnection.model('blocks', BlockSchema);

    const offsetFile = fs.readFileSync(
      __dirname + '/offset-blocks.txt',
      'utf8',
    );
    let offset = parseInt(offsetFile, 10);

    console.log('loaded offset from file', offset);

    const limit = 1000;

    let shouldContinue = true;

    while (shouldContinue) {
      const data = await prodBlocksModel.find(
        {},
        {},
        { limit: 1000, skip: offset },
      );
      console.log(`received data offset ${offset}, size: ${data.length}`);

      if (data.length < 1000) {
        shouldContinue = false;
      }

      console.log(`saving data, offset ${offset}, size: ${data.length}`);

      try {
        await devBlocksModel.insertMany(data, { ordered: false });

        console.log(`saved data, offset ${offset}, size: ${data.length}`);
      } catch (error) {
        console.log(
          `error saving data, error count: ${error.writeErrors.length}, inserted count: ${error.insertedDocs.length}, message: ${error.message}`,
        );
      }

      offset += 1000;
      fs.writeFileSync(__dirname + '/offset-blocks.txt', offset.toString());
    }

    console.log(`task finished`);
  }
}
