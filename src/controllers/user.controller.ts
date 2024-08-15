import { Request, Response, NextFunction } from "express";
import { UserSchema } from "../models";
import { aggregationHelper } from "../helper/pagination.helper";
import mongoose from "mongoose";
import { faker } from "@faker-js/faker";
import { EncryptAndDecryptService } from "../services/hash.service";
import { generateSlugName } from "../utils";

class UserController {
  async getAllUser(req: Request, res: Response, next: NextFunction) {
    try {
      let { perPage, pageNo, searchStr, role } = req.query;
      const filterArgs: mongoose.PipelineStage[] = [];
      if (searchStr) {
        filterArgs.push({
          $match: {
            $or: [
              {
                name: { $regex: searchStr, $options: "i" },
              },
              {
                email: { $regex: searchStr, $options: "i" },
              },
            ],
          },
        });
      }

      if (role) {
        filterArgs.push({
          $match: {
            role: role,
          },
        });
      }

      const mainArgs: mongoose.PipelineStage[] = [
        {
          $match: {},
        },
        {
          $project: {
            _id: 1,
            role: 1,
            name: 1,
            email: 1,
            slugName: 1,
            profileUrl: 1,
          },
        },
      ];

      const args = [...mainArgs, ...filterArgs];
      const { data, pagination } = await aggregationHelper({
        model: UserSchema,
        perPage,
        pageNo,
        args,
      });
      res.json({
        success: true,
        msg: "Get all users successfully",
        data: data,
        pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  async createDemoUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const { numberOfUsers } = req.body;
      const data: any[] = [];
      for (let i = 0; i < numberOfUsers; i++) {
        const role = i % 2 === 0 ? "USER" : "EMPLOYEE";
        const name = faker.person.fullName();
        const demoData = {
          role,
          name: name,
          email: faker.internet.email(),
          password: await new EncryptAndDecryptService().hashPassword(
            faker.internet.email()
          ),
          slugName: generateSlugName(name),
          profileUrl: faker.image.avatar(),
          profilePath: faker.system.filePath(),
          isVerified: true,
        };
        data.push(demoData);
      }
      const users = await UserSchema.insertMany(data);
      res.json({
        success: true,
        msg: "Demo users created successfully...",
        data: users,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteUsers(req: Request, res: Response, next: NextFunction) {
    try {
      await UserSchema.deleteMany({
        role: "EMPLOYEE",
      });

      res.json({
        success: true,
        msg: "Users deleted successfully...",
      });
    } catch (error) {
      next(error);
    }
  }
}

export default UserController;
