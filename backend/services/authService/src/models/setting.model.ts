
import { Schema, model, Document } from 'mongoose';

export interface ISetting extends Document {
  key: string;
  value: any;
  category: string;
  description?: string;
  isPublic: boolean;
  updatedBy?: string;
}

const SettingSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, index: true },
    value: { type: Schema.Types.Mixed, required: true },
    category: { type: String, required: true, index: true },
    description: { type: String },
    isPublic: { type: Boolean, default: false },
    updatedBy: { type: String },
  },
  { timestamps: true }
);

export const Setting = model<ISetting>('Setting', SettingSchema);
