import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ReportUsageDocument = ReportUsage & Document;

@Schema({ versionKey: false, collection: 'ReportUsage' })
export class ReportUsage {
  @Prop()
  mac: string;

  @Prop()
  name: string;

  @Prop()
  phone: string;

  @Prop()
  email: string;

  @Prop({ type: Object })
  device: {
    device: string;
    os: string;
  };

  @Prop()
  campaign: string;

  @Prop()
  location: string;

  @Prop()
  ap: string;

  @Prop()
  trackingId: string; // unifi is _id, radius is radacctid

  @Prop()
  unifiSiteId: string;

  @Prop()
  createdAt: number;

  @Prop()
  start: number;

  @Prop()
  end: number;

  @Prop()
  duration: number; // seconds
}

export const ReportUsageSchema = SchemaFactory.createForClass(ReportUsage);
