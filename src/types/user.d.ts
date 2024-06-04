import { Document } from "mongoose";
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
  email: string;
  phone: string;
  password: string;
  countryCode: string;
  profileUrl?: string;
  profilePath?: string;
  isBlocked: boolean;
  isVerified: boolean;
  fcmToken: FCMToken;
}
