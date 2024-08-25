import { Response, Request, NextFunction } from "express";
import { MIDDLEWARE_REQUEST_TYPE } from "../types/global";
import { fieldValidateError } from "../helper";
import { ChatGroupSchema, MessageSchema, UserSchema } from "../models";
import { body } from "express-validator";
import MESSAGE_TYPE, { MSG_TYPE } from "../types/message";
import USER_TYPE from "../types/user";
import CHAT_GROUP_TYPE from "../types/chat-group";
import { NotFound, InternalServerError } from "http-errors";

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

      //check is private group chat is exist
      const isGroupAlreadyExist = await ChatGroupSchema.findOne({
        isGroupChat: false,
        members: { $all: [receiver, admin] },
      });

      if (isGroupAlreadyExist) {
        return res.json({
          success: true,
          data: isGroupAlreadyExist,
          msg: "Chat group info",
        });
      }

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

      let isPrivate = false;
      if (
        req?.payload?.role === "ADMIN" ||
        req?.payload?.role === "SUPER_ADMIN"
      ) {
        isPrivate = true;
      }

      if (isPrivate) {
        const isGroupChatExist = await ChatGroupSchema.findOne({
          isGroupChat: false,
          admin: admin,
          members: { $in: [receiver] },
        });
        if (isGroupChatExist) {
          return res.json({
            success: true,
            data: isGroupChatExist,
            msg: "Chat group info",
          });
        }
        const privateChatGroup = await ChatGroupSchema.create({
          name: "Private",
          isGroupChat: false,
          admin: admin,
          members: [receiver, admin],
        });
        return res.json({
          success: true,
          msg: "You are connected",
          data: privateChatGroup,
        });
      }

      //check is private group chat is exist
      const isGroupAlreadyExist = await ChatGroupSchema.findOne({
        isGroupChat: false,
        members: { $all: [receiver, admin] },
      });

      if (isGroupAlreadyExist) {
        return res.json({
          success: true,
          data: isGroupAlreadyExist,
          msg: "Chat group info",
        });
      }

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

  async createMessagePrivateGroup(
    req: MIDDLEWARE_REQUEST_TYPE,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { type, sender, chatGroup, content }: MESSAGE_TYPE = req?.body;
      fieldValidateError(req);
      if (
        type === "DOCUMENT" ||
        type === "AUDIO" ||
        type === "IMAGE" ||
        type === "VIDEO"
      ) {
        const fileContent = req?.files?.file;
        if (!fileContent) throw new NotFound("file content is required");
      }

      const message = await MessageSchema.create({
        content,
        type,
        sender,
        chatGroup,
      });

      if (!message)
        throw new InternalServerError(
          "Something went wrong!! message is not created"
        );

      res.json({
        success: true,
        data: message,
        msg: "Message created successfully..",
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

export default ChatController;
