import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ _id: false, collection: 'usa_listings_data' })
export class PropertiesData {
  @Prop()
  _id: Types.ObjectId;

  @Prop()
  status: string;

  @Prop()
  price: number;

  @Prop()
  bed: number;

  @Prop()
  bath: number;

  @Prop()
  acre_lot: number;

  @Prop()
  full_address: string;

  @Prop()
  street: string;

  @Prop()
  city: string;

  @Prop()
  state: string;

  @Prop()
  zip_code: number;

  @Prop()
  house_size: number;

  @Prop()
  sold_date: string;
}

export const PropertiesDataSchema =
  SchemaFactory.createForClass(PropertiesData);
export type PropertiesDataDocument = PropertiesData & Document;
