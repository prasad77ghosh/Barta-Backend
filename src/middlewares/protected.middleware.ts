import { NextFunction, Response } from "express";
import { MIDDLEWARE_REQUEST_TYPE } from "../types/global";
import { Unauthorized, Locked } from "http-errors";
import { UserSchema } from "../models";
import MIDDLEWARE_OTP_TYPE from "../types/otp";
import JwtService from "../services/jwt.service";
import cookie from "cookie";
import { IncomingMessage } from "http";

export default class ProtectedMiddleware extends JwtService {
  public async preProtected(
    req: MIDDLEWARE_OTP_TYPE,
    res: Response,
    next: NextFunction
  ) {
    try {
      const token = req.cookies.otp_token;
      console.log({ token });
      if (!token) throw new Unauthorized("Unauthorized");
      const payload = super.otpTokenVerify(token);
      if (!payload?.aud) throw new Unauthorized("Unauthorized");
      let userObj = JSON.parse(payload.aud);
      if (!userObj.userId) throw new Unauthorized("Unauthorized");
      const user = await UserSchema.findById(userObj.userId).select("status");
      if (!user) throw new Unauthorized("Unauthorized");
      req.payload = userObj;
      next();
    } catch (error) {
      next(error);
    }
  }

  public async protected(
    req: MIDDLEWARE_REQUEST_TYPE,
    res: Response,
    next: NextFunction
  ) {
    try {
      const token = req.cookies.accessToken;
      if (!token) throw new Unauthorized("Unauthorized");
      const payload = super.accessTokenVerify(token);
      if (!payload?.aud) throw new Unauthorized("Unauthorized");
      let userObj = JSON.parse(payload.aud);
      if (!userObj.userId) throw new Unauthorized("Unauthorized");
      const user = await UserSchema.findById(userObj.userId);
      if (!user) throw new Unauthorized("Unauthorized");
      if (!user.isVerified) throw new Locked("You are not a verified user");
      if (user.isBlocked)
        throw new Locked("You are blocked by your higher authority..");
      req.payload = userObj;
      next();
    } catch (error) {
      next(error);
    }
  }

  public async isAdmin(
    req: MIDDLEWARE_REQUEST_TYPE,
    res: Response,
    next: NextFunction
  ) {
    try {
      const token = req.cookies.accessToken;
      if (!token) throw new Unauthorized("Unauthorized");
      const payload = super.accessTokenVerify(token);
      if (!payload?.aud) throw new Unauthorized("Unauthorized");
      let userObj = JSON.parse(payload.aud);
      if (!userObj.userId) throw new Unauthorized("Unauthorized");
      const user = await UserSchema.findById(userObj.userId);
      if (!user) throw new Unauthorized("Unauthorized");

      if (user.role !== "ADMIN")
        throw new Unauthorized("You are not authorized to perform this action");

      if (!user.isVerified) throw new Locked("You are not verified user.");
      if (user.isBlocked)
        throw new Locked("You are blocked by your higher authority..");
      req.payload = userObj;
      next();
    } catch (error) {
      next(error);
    }
  }

  public async isEmployee(
    req: MIDDLEWARE_REQUEST_TYPE,
    res: Response,
    next: NextFunction
  ) {
    try {
      const token = req.cookies.accessToken;
      if (!token) throw new Unauthorized("Unauthorized");

      const payload = super.accessTokenVerify(token);
      if (!payload?.aud) throw new Unauthorized("Unauthorized");
      let userObj = JSON.parse(payload.aud);
      if (!userObj.userId) throw new Unauthorized("Unauthorized");
      const user = await UserSchema.findById(userObj.userId);
      if (!user) throw new Unauthorized("Unauthorized");

      if (user.role !== "EMPLOYEE")
        throw new Unauthorized("You are not authorized to perform this action");

      if (!user.isVerified) throw new Locked("You are not a verified user");
      if (user.isBlocked)
        throw new Locked("You are blocked by your higher authority..");
      req.payload = userObj;
      next();
    } catch (error) {
      next(error);
    }
  }

  public async isEmployeeOrAdmin(
    req: MIDDLEWARE_REQUEST_TYPE,
    res: Response,
    next: NextFunction
  ) {
    try {
      const token = req.cookies.accessToken;
      if (!token) throw new Unauthorized("Unauthorized");

      const payload = super.accessTokenVerify(token);
      if (!payload?.aud) throw new Unauthorized("Unauthorized");
      let userObj = JSON.parse(payload.aud);
      if (!userObj.userId) throw new Unauthorized("Unauthorized");
      const user = await UserSchema.findById(userObj.userId);
      if (!user) throw new Unauthorized("Unauthorized");

      const roles = ["EMPLOYEE", "ADMIN"];
      if (!roles.includes(user.role))
        throw new Unauthorized("You are not authorized to perform this action");

      if (!user.isVerified) throw new Locked("You are not a verified user");
      if (user.isBlocked)
        throw new Locked("You are blocked by your higher authority..");
      req.payload = userObj;
      next();
    } catch (error) {
      next(error);
    }
  }

  public async socketAuthenticator(socket: any, next: any) {
    try {
      const req = socket.request as IncomingMessage;
      const cookies: any = cookie.parse(req.headers.cookie || "");
      const token = cookies.accessToken;
      if (!token) throw new Unauthorized("Unauthorized");
      const payload = super.accessTokenVerify(token);
      if (!payload?.aud) throw new Unauthorized("Unauthorized");
      let userObj = JSON.parse(payload.aud);
      if (!userObj.userId) throw new Unauthorized("Unauthorized");
      const user = await UserSchema.findById(userObj.userId).select("status");
      if (!user) throw new Unauthorized("Unauthorized");
      socket.user = userObj;
      next();
    } catch (error) {
      next(error);
    }
  }
}
