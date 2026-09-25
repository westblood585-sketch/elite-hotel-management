import mongoose, { Schema } from "mongoose";
import IOtp from "../interfaces/IOtp";

const otpSchema: Schema = new Schema({
  email: { type: String, required: true, index: true },
  otp: { type: String, required: true },
  attempts: { type: Number, default: 0 }, // Track verification attempts
  expiresAt: { type: Date, required: true }, // Explicit expiry time
  createdAt: { type: Date, default: Date.now, expires: 600 }, // TTL: 10 minutes (600 seconds)
});

// Compound index for efficient queries
otpSchema.index({ email: 1, createdAt: -1 });

const Otp = mongoose.model<IOtp>("Otp", otpSchema);
export default Otp;
