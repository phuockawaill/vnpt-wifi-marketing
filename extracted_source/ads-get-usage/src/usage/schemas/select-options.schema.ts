import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type SelectOptionDocument = SelectOption & Document;

@Schema({ versionKey: false, collection: 'SelectOption' })
export class SelectOption {
  @Prop()
  type: string;

  @Prop()
  text: string;

  @Prop()
  value: string;

  @Prop({ type: Object })
  options: {
    isTrackUsage: boolean;
  };

  @Prop({ type: Object })
  externalParams: any;

  @Prop({ type: Object })
  unifi: any;

  @Prop({ type: Object })
  aerohive: any;
}

export const SelectOptionSchema = SchemaFactory.createForClass(SelectOption);
