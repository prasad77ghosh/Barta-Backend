import { NextFunction, Response } from "express";
import { MIDDLEWARE_REQUEST_TYPE } from "../types/global";
import CHAT_NOTIFICATION from "../types/chat-notification";
import { aggregationHelper, fieldValidateError } from "../helper";
import ChatNotificationSchema from "../models/chat-notification.model";
import mongoose from "mongoose";
import { body } from "express-validator";

class NotificationController {
  async createNotification(
    req: MIDDLEWARE_REQUEST_TYPE,
    res: Response,
    next: NextFunction
  ) {
    try {
      const data: CHAT_NOTIFICATION = req.body;
      fieldValidateError(req);
      await ChatNotificationSchema.create(data);
      res.json({
        success: true,
        msg: "notification created successfully....",
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteNotification(
    req: MIDDLEWARE_REQUEST_TYPE,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { groupId, notificationIds } = req?.body;
      fieldValidateError(req);
      if (groupId) {
        const allNotifications = await ChatNotificationSchema.find({
          groupId,
        });
        const allNotificationIds = allNotifications?.map(
          (notification) => notification?._id
        );
        await ChatNotificationSchema.deleteMany({
          _id: { $in: allNotificationIds },
        });
        return res.json({
          success: true,
          msg: "All notifications deleted successfully...",
        });
      }

      await ChatNotificationSchema.deleteMany({
        _id: { $in: notificationIds },
      });

      res.json({
        success: true,
        msg: "All notifications deleted successfully...",
      });
    } catch (error) {
      next(error);
    }
  }

  async getAllNotifications(
    req: MIDDLEWARE_REQUEST_TYPE,
    res: Response,
    next: NextFunction
  ) {
    try {
      let { perPage, pageNo, groupId } = req?.body;
      fieldValidateError(req);

      const filterArgs: mongoose.PipelineStage[] = [];

      const mainArgs: mongoose.PipelineStage[] = [
        {
          $match: {
            groupId: new mongoose.Types.ObjectId(groupId),
          },
          $project: {
            _id: 1,
            groupId: 1,
            sender: 1,
            groupName: 1,
            message: 1,
          },
        },
      ];

      const { data, pagination } = await aggregationHelper({
        model: ChatNotificationSchema,
        perPage,
        pageNo,
        filterArgs,
        args: mainArgs,
      });

      res.json({
        success: true,
        msg: "get All notifications successfully...",
        data: data,
        pagination,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const NotificationControllerValidator = {
  createNotification: [
    body("groupId")
      .notEmpty()
      .withMessage("groupId is required")
      .bail()
      .isMongoId()
      .withMessage("groupId must be a mongo id"),
    body("sender")
      .optional()
      .bail()
      .isString()
      .withMessage("sender must be a string"),
    body("groupName")
      .optional()
      .bail()
      .isString()
      .withMessage("groupName must be a string"),
    body("message")
      .notEmpty()
      .withMessage("message is required")
      .isString()
      .withMessage("message must be a string"),
  ],

  deleteNotification: [
    body("groupId").custom(({ req }: { req: Request }) => {
      const { notificationIds }: any = req?.body;
      if (!notificationIds || notificationIds.length === 0) {
        throw new Error("groupId is required");
      }
      return true;
    }),
  ],

  getAllNotifications: [
    body("groupId")
      .notEmpty()
      .withMessage("groupId is required")
      .bail()
      .isMongoId()
      .withMessage("groupId must be a mongoId"),
  ],
};

export default NotificationController;
