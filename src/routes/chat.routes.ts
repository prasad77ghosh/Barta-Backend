import { Router } from "express";
import ChatController, {
  ChatControllerValidator,
} from "../controllers/chat.controller";
import ProtectedMiddleware from "../middlewares/protected.middleware";

export default class ChatRoutes {
  public router: Router;
  private chatController: ChatController;
  public path = "chat";

  constructor() {
    this.router = Router();
    this.chatController = new ChatController();
    this.routes();
  }

  private routes() {
    this.router.post(
      "/create-private-group",
      ChatControllerValidator.createPrivateChatGroup,
      new ProtectedMiddleware().protected,
      this.chatController.createPrivateChatGroup
    );

    this.router.post(
      "/create-private-group-shomes",
      ChatControllerValidator.createPrivateChatGroup,
      new ProtectedMiddleware().protected,
      this.chatController.createPrivateChatGroupForShomes
    );

    this.router.post(
      "/create-group",
      ChatControllerValidator.createChatGroup,
      new ProtectedMiddleware().protected,
      this.chatController.createChatGroup
    );

    this.router.get(
      "/get-all-connected",
      new ProtectedMiddleware().protected,
      this.chatController.getAllConnectedMembers
    );
  }
}
