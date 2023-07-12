import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({
  collection: 'data_cache',
  autoIndex: true,
})
export class Cache {
  @Prop({ type: Types.ObjectId })
  _id: Types.ObjectId;

  @Prop()
  type: string;

  @Prop({ type: Object })
  data: object;
}

export const CacheSchema = SchemaFactory.createForClass(Cache);

export type CacheDocument = Cache & Document;
