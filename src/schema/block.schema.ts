import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({
  collection: 'blocks',
  autoIndex: true,
})
export class Block {
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
}

export const BlockSchema = SchemaFactory.createForClass(Block);

export type BlockDocument = Block & Document;

BlockSchema.index({ listingId: 1, type: 1, startDate: 1 });
BlockSchema.index({ listingId: 1 });
