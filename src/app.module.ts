import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';

import { MongooseModule } from '@nestjs/mongoose';
import { Block, BlockSchema } from './schema/block.schema';
import { Listing, ListingSchema } from './schema/listing.schema';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';
import { Cache, CacheSchema } from './schema/cache.schema';

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
    ]),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
