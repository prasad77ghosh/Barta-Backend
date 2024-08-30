import { Server as HttpServer } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";
import express, { Application } from "express";
import ProtectedMiddleware from "../middlewares/protected.middleware";
import { ClientToServerEvents, ServerToClientEvents } from "./event";
import { cookieInfo, corsInfo } from "./info";
import { joinRoom, sendMessage } from "./function";
import { v4 as uuid } from "uuid";

class SocketServer {
  private io: SocketIOServer<ClientToServerEvents, ServerToClientEvents>;
  private app: Application;
  private sockedIds: Map<string, string>;

  constructor(server: HttpServer) {
    this.sockedIds = new Map();
    this.io = new SocketIOServer(server, {
      cors: corsInfo,
      cookie: cookieInfo as any,
    });
    // socket middleware
    this.io.use(async (socket: Socket, next) => {
      try {
        await new ProtectedMiddleware().socketAuthenticator(socket, next);
      } catch (err: any) {
        next(err);
      }
    });
    this.app = express();
    this.app.set("io", this.io);
    this.io.on("connection", this.onConnection);
  }

  private onConnection = (
    socket: Socket<ClientToServerEvents, ServerToClientEvents>
  ) => {
    const user = (socket as any).user;
    this.sockedIds.set(user?.userId?.toString(), socket.id);
    console.log(`Client connected: ${user.name}`);
    // room join logic
    joinRoom({ socket, user, io: this.io });

    //send message
    sendMessage({ socket, user, io: this.io });

    socket.on("disconnect", () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  };
}

export default SocketServer;
