import { Router } from "express";
import UserController from "../controllers/user.controller";
import ProtectedMiddleware from "../middlewares/protected.middleware";

export default class UserRoutes {
  public router: Router;
  private userController: UserController;
  public path = "users";

  constructor() {
    this.router = Router();
    this.userController = new UserController();
    this.routes();
  }

  private routes() {
    this.router.get(
      "/",
      // new ProtectedMiddleware().protected,
      this.userController.getAllUser
    );

    this.router.post("/create-demo-users", this.userController.createDemoUsers);
    this.router.delete("/delete-users", this.userController.deleteUsers);
  }
}
