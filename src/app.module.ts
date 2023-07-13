import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';

import { MongooseModule } from '@nestjs/mongoose';
import { Block, BlockSchema } from './schema/block.schema';
import { Listing, ListingSchema } from './schema/listing.schema';
import {
  PropertiesData,
  PropertiesDataSchema,
} from './schema/properties-data.schema';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';
import { Cache, CacheSchema } from './schema/cache.schema';
import { RoiService } from './roi.service';
import { CsvimportTask } from './cmd/csvimport.task';
import { MongoImportTask } from './cmd/mongo-import.task';
import { MongoImportBlockTask } from './cmd/mongo-import-block.task';
import { State, StateSchema } from './schema/state.schema';

@Module({
  imports: [
    ConfigModule.forRoot({
      validationSchema: Joi.object({
        MONGO_CONNECTION_STRING: Joi.string().required(),
      }),
    }),
    MongooseModule.forRoot(process.env.MONGO_CONNECTION_STRING),
    MongooseModule.forFeature([
      { name: Block.name, schema: BlockSchema },
      { name: Listing.name, schema: ListingSchema },
      { name: Cache.name, schema: CacheSchema },
      { name: PropertiesData.name, schema: PropertiesDataSchema },
      { name: State.name, schema: StateSchema },
    ]),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    RoiService,
    CsvimportTask,
    MongoImportTask,
    MongoImportBlockTask,
  ],
})
export class AppModule {}
