import { Router } from "express";
import AuthController, {
  AuthControllerValidator,
} from "../controllers/auth.controller";
import ProtectedMiddleware from "../middlewares/protected.middleware";

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
      "/signup",
      AuthControllerValidator.registerValidation,
      this.authController.register
    );

    this.router.post(
      "/verify-otp-and-login",
      AuthControllerValidator.verifyOtpAndLogin,
      new ProtectedMiddleware().preProtected,
      this.authController.verifyOtpAndLogin
    );

    this.router.post(
      "/resend-otp",
      new ProtectedMiddleware().preProtected,
      this.authController.resendOtp
    );

    this.router.post(
      "/login",
      AuthControllerValidator.login,
      this.authController.login
    );

    this.router.post(
      "/forgot-password",
      AuthControllerValidator.forgotPassword,
      this.authController.forgotPassword
    );

    this.router.post(
      "/update-password",
      AuthControllerValidator.updatePassword,
      new ProtectedMiddleware().preProtected,
      this.authController.updatePassword
    );

    this.router.get(
      "/pre-protected-self-data",
      new ProtectedMiddleware().preProtected,
      this.authController.getSelf
    );

    this.router.get(
      "/self",
      new ProtectedMiddleware().protected,
      this.authController.getSelf
    );

    this.router.put(
      "/profile-update",
      new ProtectedMiddleware().protected,
      AuthControllerValidator.updateProfile,
      this.authController.updateProfile
    );

    this.router.put(
      "/change-password",
      new ProtectedMiddleware().protected,
      AuthControllerValidator.changePassword,
      this.authController.changePassword
    );

    this.router.get(
      "/refresh-access-token",
      // new ProtectedMiddleware().protected,
      this.authController.refreshAccessToken
    );
  }
}
