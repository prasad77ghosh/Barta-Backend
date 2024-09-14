import { Router } from "express";
import UserController from "../controllers/user.controller";
import ProtectedMiddleware from "../middlewares/protected.middleware";
import NotificationController, {
  NotificationControllerValidator,
} from "../controllers/notification.controller";

export default class NotificationRoutes {
  public router: Router;
  private notificationController: NotificationController;
  public path = "notifications";

  constructor() {
    this.router = Router();
    this.notificationController = new NotificationController();
    this.routes();
  }

  private routes() {
    this.router.post(
      "/create-notification",
      NotificationControllerValidator.createNotification,
      new ProtectedMiddleware().protected,
      this.notificationController.createNotification
    );
    this.router.delete(
      "/delete-notification",
      NotificationControllerValidator.deleteNotification,
      new ProtectedMiddleware().protected,
      this.notificationController.deleteNotification
    );

    this.router.get(
      "/all",
      NotificationControllerValidator.getAllNotifications,
      new ProtectedMiddleware().protected,
      this.notificationController.getAllNotifications
    );
  }
}
