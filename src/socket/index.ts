import { Server as HttpServer } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";
import express, { Application } from "express";
import ProtectedMiddleware from "../middlewares/protected.middleware";
import { ClientToServerEvents, ServerToClientEvents } from "./event";
import { cookieInfo, corsInfo } from "./info";
import { joinRoom, leaveRoom, sendMessage } from "./function";

class SocketServer {
  private io: SocketIOServer<ClientToServerEvents, ServerToClientEvents>;
  private app: Application;
  private socketIds: Map<string, string>;
  private roomMembers: Map<string, string>;

  constructor(server: HttpServer) {
    this.socketIds = new Map();
    this.roomMembers = new Map();
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
    this.socketIds.set(user?.userId?.toString(), socket.id);
    console.log(`Client connected: ${socket.id}, ${user.name}`);

    // Room join logic
    joinRoom({
      socket,
      user,
      io: this.io,
      roomMembers: this.roomMembers,
      socketIds: this.socketIds,
    });

    // Room leave logic
    leaveRoom({ socket, user, io: this.io });

    // Send message logic
    sendMessage({
      socket,
      user,
      io: this.io,
      roomMembers: this.roomMembers,
      socketIds: this.socketIds,
    });

    socket.on("disconnect", () => {
      console.log(`Client disconnected: ${socket.id}`);
      // Remove the socket id on disconnect
      this.socketIds.forEach((value, key) => {
        if (value === socket.id) {
          this.socketIds.delete(key);
        }
      });
    });
  };

  // Getter for io
  public getIO() {
    return this.io;
  }

  // Getter for socketIds
  public getSocketIds() {
    return this.socketIds;
  }

  // Getter for roomMembers
  public getRoomMembers() {
    return this.roomMembers;
  }

  // Static method to access SocketServer instance
  private static instance: SocketServer;

  public static getInstance(server: HttpServer) {
    if (!SocketServer.instance) {
      SocketServer.instance = new SocketServer(server);
    }
    return SocketServer.instance;
  }
}

export default SocketServer;
