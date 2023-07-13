import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Listing, ListingSchema } from './listing.schema';

@Schema({ _id: false })
class Money {
  @Prop()
  hostPayout: number;
}

const MoneySchema = SchemaFactory.createForClass(Money);

@Schema({ _id: false })
class Reservation {
  @Prop({ type: MoneySchema })
  money: Money;
}

const ReservationSchema = SchemaFactory.createForClass(Reservation);

@Schema({
  collection: 'blocks_v3',
  autoIndex: true,
})
export class BlockV3 {
  @Prop()
  isListingActive: boolean;
  @Prop({ type: Types.ObjectId })
  _id: Types.ObjectId;
  @Prop({ type: Types.ObjectId })
  listingId: Types.ObjectId;
  @Prop({ type: Types.ObjectId })
  accountId: Types.ObjectId;
  @Prop()
  startDate: Date;
  @Prop()
  endDate: Date;
  @Prop()
  type: string;

  @Prop({ type: Types.ObjectId })
  reservationId: Types.ObjectId;

  @Prop({ type: ReservationSchema })
  reservation: Reservation;

  @Prop({ type: ListingSchema })
  listing: Listing;
}

export const BlockSchemaV3 = SchemaFactory.createForClass(BlockV3);

export type BlockDocumentV3 = BlockV3 & Document;

BlockSchemaV3.index({ listingId: 1, type: 1, startDate: 1 });
BlockSchemaV3.index({ listingId: 1 });
