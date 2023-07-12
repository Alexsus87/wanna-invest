import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';

import { MongooseModule } from '@nestjs/mongoose';
import { Block, BlockSchema } from './schema/block.schema';
import { Listing, ListingSchema } from './schema/listing.schema';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';
import * as process from "process";

@Module({
  imports: [
    ConfigModule.forRoot({
      validationSchema: Joi.object({
        MONGO_CONNECTION_STRING: Joi.string().required(),
      }),
    }),
    MongooseModule.forRootAsync({
      useFactory: () => {
        console.log(process.env.MONGO_CONNECTION_STRING);
        return {
          uri: process.env.MONGO_CONNECTION_STRING,
        };
      },
    }),
    MongooseModule.forFeature([
      { name: Block.name, schema: BlockSchema },
      { name: Listing.name, schema: ListingSchema },
    ]),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
