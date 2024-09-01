import { Document } from "mongoose";
import CHAT_GROUP_TYPE from "./chat-group";
export type FCMToken = {
  web?: string;
  android?: string;
  ios?: string;
};

export type ROLE = "CUSTOMER" | "ADMIN" | "EMPLOYEE" | "SUPER_ADMIN" | "USER";

export default interface USER_TYPE extends Document {
  role: ROLE;
  name: string;
  slugName: string;
  googleId?: string;
  email: string;
  phone: string;
  password: string;
  countryCode: string;
  profileUrl?: string;
  profilePath?: string;
  isBlocked: boolean;
  isVerified: boolean;
  hashOtp?: string;
  otpExpire?: Date;
  chatGroups: CHAT_GROUP_TYPE[];
  refreshToken?: string;
  fcmToken: FCMToken;
}
