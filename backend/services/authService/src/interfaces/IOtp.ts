import { Document } from "mongoose";

interface IOtp extends Document {
  email: string;
  otp: string;
  createdAt: Date;
  expiresAt: Date;
}

export default IOtp;
