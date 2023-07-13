import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ _id: false, collection: 'states_data' })
export class State {
  @Prop()
  _id: Types.ObjectId;

  @Prop()
  price: number;

  @Prop()
  state: string;
}

export const StateSchema = SchemaFactory.createForClass(State);
export type StateDocument = State & Document;
