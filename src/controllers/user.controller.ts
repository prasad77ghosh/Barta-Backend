import { Request, Response, NextFunction } from "express";

class UserController {
  async getAllUser(req: Request, res: Response, next: NextFunction) {
    try {
    } catch (error) {
      next(error);
    }
  }
}
