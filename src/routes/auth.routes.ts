import { Router } from "express";
import AuthController, {
  AuthControllerValidator,
} from "../controllers/auth.controller";

export default class AuthRoutes {
  public router: Router;
  private authController: AuthController;
  public path = "auth";

  constructor() {
    this.router = Router();
    this.authController = new AuthController();
    this.routes();
  }

  private routes() {
    this.router.post(
      "/register",
      AuthControllerValidator.registerValidation,
      this.authController.register
    );
  }
}
