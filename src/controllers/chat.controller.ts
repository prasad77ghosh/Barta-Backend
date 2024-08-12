import { Response, Request, NextFunction } from "express";
import { MIDDLEWARE_REQUEST_TYPE } from "../types/global";
import { fieldValidateError } from "../helper";
import { ChatGroupSchema, UserSchema } from "../models";
import { body } from "express-validator";

class ChatController {
  async createPrivateChatGroup(
    req: MIDDLEWARE_REQUEST_TYPE,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { receiver } = req.body;
      fieldValidateError(req);
      const admin = req?.payload?.userId;
      const privateChatGroup = await ChatGroupSchema.create({
        name: "Private",
        isGroupChat: false,
        admin: admin,
        members: [receiver, admin],
      });
      res.json({
        success: true,
        msg: "You are connected",
        data: privateChatGroup,
      });
    } catch (error) {
      next(error);
    }
  }

  async createPrivateChatGroupForShomes(
    req: MIDDLEWARE_REQUEST_TYPE,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { receiver } = req.body;
      fieldValidateError(req);
      const admin = req?.payload?.userId;
      const allAdmin = await UserSchema.find({
        role: "ADMIN",
      });
      const adminIdsArr = allAdmin && allAdmin.map((admin) => admin._id);
      const members = [...adminIdsArr, admin, receiver];
      const privateGroupOfShomes = await ChatGroupSchema.create({
        name: "Private",
        members: members,
        isGroupChat: false,
        admin,
      });
      res.json({
        success: true,
        msg: "shomes private group create successfully...",
        data: privateGroupOfShomes,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const ChatControllerValidator = {
  createPrivateChatGroup: [
    body("receiver")
      .notEmpty()
      .withMessage("receiver is required")
      .bail()
      .isMongoId()
      .withMessage("receiver must be a mongo id"),
  ],
};
