import { Response, Request, NextFunction } from "express";
import { MIDDLEWARE_REQUEST_TYPE } from "../types/global";
import { aggregationHelper, fieldValidateError } from "../helper";
import {
  ChatGroupSchema,
  GroupMemberSchema,
  MessageSchema,
  UserSchema,
} from "../models";
import { body, param } from "express-validator";
import MESSAGE_TYPE, { MSG_TYPE } from "../types/message";
import USER_TYPE from "../types/user";
import CHAT_GROUP_TYPE from "../types/chat-group";
import {
  NotFound,
  InternalServerError,
  Conflict,
  NotAcceptable,
} from "http-errors";
import mongoose, { Schema } from "mongoose";
import { v4 as uuid } from "uuid";
import { MediaStoreService } from "../services/media.service";
import SocketServer from "../socket";
import App from "../app";
import { getSocketInfo } from "../functions/chat.functions";

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

  async createChatGroup(
    req: MIDDLEWARE_REQUEST_TYPE,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { members, name } = req.body;
      const userId = req?.payload?.userId;
      fieldValidateError(req);

      // check if group exist or not

      const isExist = await ChatGroupSchema.findOne({
        name: name,
      });

      if (isExist)
        throw new Conflict("A group is already exist with this name");

      const group = await ChatGroupSchema.create({
        name: name,
        admin: userId,
        isGroupChat: true,
      });

      if (group) {
        const memberDocuments = members.map((member: string) => ({
          group: group._id,
          member: member,
        }));
        await GroupMemberSchema.insertMany(memberDocuments);

        await UserSchema.updateMany(
          { _id: { $in: members } },
          {
            $push: {
              chatGroups: new mongoose.Types.ObjectId(group._id),
            },
          }
        );
      }
      res.json({
        success: true,
        msg: "Group created successfully...",
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

  async getAllConnectedMembers(
    req: MIDDLEWARE_REQUEST_TYPE,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { perPage, pageNo, searchStr } = req?.query;

      const userId = req?.payload?.userId;
      const user = await UserSchema.findById(userId)
        .select("chatGroups")
        .lean();

      fieldValidateError(req);

      const userChatGroups = user && user?.chatGroups ? user.chatGroups : [];

      const filterArgs: mongoose.PipelineStage[] = [];

      const mainArgs: mongoose.PipelineStage[] = [
        {
          $match: {
            $and: [
              {
                $or: [
                  {
                    admin: new mongoose.Types.ObjectId(userId),
                  },
                  {
                    members: new mongoose.Types.ObjectId(userId),
                  },
                  {
                    _id: { $in: userChatGroups },
                  },
                ],
              },
              {
                lastMsg: {
                  $exists: true,
                },
              },
            ],
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "members",
            foreignField: "_id",
            as: "memberDetails",
            pipeline: [
              {
                $project: {
                  _id: 1,
                  role: 1,
                  name: 1,
                  email: 1,
                  isVerified: 1,
                  slugName: 1,
                  profileUrl: 1,
                },
              },
            ],
          },
        },
        {
          $lookup: {
            from: "messages",
            localField: "lastMsg",
            foreignField: "_id",
            as: "lastMessage",
            pipeline: [
              {
                $project: {
                  _id: 1,
                  content: 1,
                  type: 1,
                  createdAt: 1,
                },
              },
            ],
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "admin",
            foreignField: "_id",
            as: "AdminInfo",
            pipeline: [
              {
                $project: {
                  _id: 1,
                  name: 1,
                  email: 1,
                  slugName: 1,
                },
              },
            ],
          },
        },
        {
          $project: {
            _id: 1,
            name: 1,
            isGroupChat: 1,
            isMessaged: 1,
            profile: 1,
            memberDetails: 1,
            lastMessage: { $arrayElemAt: ["$lastMessage", 0] },
            admin: { $arrayElemAt: ["$AdminInfo", 0] },
            createdAt: 1,
            updatedAt: 1,
          },
        },
        {
          $sort: {
            updatedAt: -1,
            createdAt: -1,
          },
        },
      ];

      const { data, pagination } = await aggregationHelper({
        model: ChatGroupSchema,
        perPage,
        pageNo,
        filterArgs,
        args: mainArgs,
      });

      res.json({
        success: true,
        msg: "get all connected successfully...",
        data: data,
        pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  async getAllMessagesOfGroup(
    req: MIDDLEWARE_REQUEST_TYPE,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { groupId } = req.params;
      const { perPage, pageNo, searchStr } = req.query;
      fieldValidateError(req);

      const filterArgs: mongoose.PipelineStage[] = [];
      const mainArgs: mongoose.PipelineStage[] = [
        {
          $match: {
            chatGroup: new mongoose.Types.ObjectId(groupId),
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "sender",
            foreignField: "_id",
            as: "Sender",
            pipeline: [
              {
                $project: {
                  _id: 1,
                  name: 1,
                  email: 1,
                  slogName: 1,
                },
              },
            ],
          },
        },
        {
          $project: {
            _id: 1,
            type: 1,
            attachments: 1,
            content: 1,
            chatGroup: 1,
            createdAt: 1,
            updatedAt: 1,
            sender: { $arrayElemAt: ["$Sender", 0] },
          },
        },
        {
          $sort: {
            updatedAt: -1,
            createdAt: -1,
          },
        },
      ];

      const { data, pagination } = await aggregationHelper({
        model: MessageSchema,
        perPage,
        pageNo,
        filterArgs,
        args: mainArgs,
      });

      res.json({
        success: true,
        data,
        pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  async sendMedia(
    req: MIDDLEWARE_REQUEST_TYPE,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { groupId, groupName, content, type } = req?.body;
      const sender = req?.payload?.userId;
      const medias: any = req?.files?.files;

      const group = await ChatGroupSchema.findById(groupId);

      if ((Array.isArray(medias) && medias.length === 0) || !medias) {
        throw new NotAcceptable("Minimum 1 image is required");
      }
      if (Array.isArray(medias) && medias.length > 5) {
        throw new NotAcceptable("Maximum you can give 5 images");
      }

      const attachments: any[] = [];
      if (Array.isArray(medias)) {
        await Promise.all(
          medias.map(async (media) => {
            if (media) {
              const attachment = (await new MediaStoreService().upload({
                files: media,
                folder: `${groupName}-${groupId}`,
              })) as {
                key: string;
                Location: string;
              };

              if (attachment) {
                attachments.push({
                  mediaPath: attachment?.Location,
                  mediaUrl: attachment?.key,
                });
              }
            }
          })
        );
      } else {
        const attachment = (await new MediaStoreService().upload({
          files: medias,
          folder: `${groupName}-${groupId}`,
        })) as {
          key: string;
          Location: string;
        };

        if (attachment) {
          attachments.push({
            mediaPath: attachment?.Location,
            mediaUrl: attachment?.key,
          });
        }
      }

      // send media files

      const messageForRealTime: any = {
        _id: uuid(),
        type: type,
        content: content,
        chatGroup: groupId,
        attachments: attachments,
        sender: {
          _id: sender,
          name: req?.payload?.name,
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const messageForDB: any = {
        type: type,
        content: content,
        chatGroup: groupId,
        attachments: attachments,
        sender,
      };

      // const server = App.server;
      // const instance = SocketServer.getInstance(server);
      // const io = instance.getIO();
      // const socketIds = instance.getSocketIds();
      // const roomMembers = instance.getRoomMembers();
      const { io } = getSocketInfo();

      io.to(groupId).emit("NEW_MESSAGE", {
        groupId,
        message: messageForRealTime,
      });

      const message = await MessageSchema.create(messageForDB);

      res.json({
        success: true,
        msg: "file send successfully..",
        data: message,
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
  createChatGroup: [
    body("name").notEmpty().withMessage("Name is required"),
    body("members")
      .notEmpty()
      .withMessage("members is required")
      .bail()
      .isArray({ min: 1 })
      .withMessage("Ids should be an array with at least one element.")
      .custom((value) => {
        return value.every((id: string) => {
          return /^[0-9a-fA-F]{24}$/.test(id);
        });
      })
      .withMessage("All elements in ids must be valid MongoDB ObjectIDs."),
  ],

  getAllMessagesOfGroup: [
    param("groupId")
      .notEmpty()
      .withMessage("groupId id required")
      .bail()
      .isMongoId()
      .isMongoId()
      .withMessage("groupId must be a mongo id"),
  ],
};

export default ChatController;
