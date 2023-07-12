import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ _id: false })
export class Address {
  @Prop()
  full: string;

  @Prop()
  street?: string;

  @Prop()
  country: string;

  @Prop()
  state: string;

  @Prop()
  lat: string;

  @Prop()
  lng: string;

  @Prop()
  zipcode: string;

  @Prop()
  city: string;
}
export const AddressSchema = SchemaFactory.createForClass(Address);

@Schema({ _id: false })
class Prices {
  @Prop()
  basePrice: number;

  @Prop()
  currency: string;
}
const PricesSchema = SchemaFactory.createForClass(Prices);

@Schema({ autoIndex: true })
export class Listing {
  @Prop({ type: Types.ObjectId })
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId })
  accountId: string;

  @Prop()
  title: string;

  @Prop()
  nickname: string;

  @Prop({ type: AddressSchema })
  address: Address;

  @Prop({ type: PricesSchema })
  prices: Prices;

  @Prop()
  active: boolean;
}

export const ListingSchema = SchemaFactory.createForClass(Listing);
export type ListingDocument = Listing & Document;

ListingSchema.index({
  'address.country': 1,
  'address.state': 1,
});
