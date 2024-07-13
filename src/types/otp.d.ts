import { Request } from "express";

export default interface MIDDLEWARE_OTP_TYPE extends Request {
  payload?: {
    userId: string;
  };
}
