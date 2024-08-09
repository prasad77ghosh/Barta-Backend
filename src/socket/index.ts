import { Server as HttpServer } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";
import express, { Application, NextFunction, Request, Response } from "express";
import cookieParser from "cookie-parser";
import ProtectedMiddleware from "../middlewares/protected.middleware";
import { IncomingMessage } from "http";
import cookie from "cookie";

// interfaces
interface ServerToClientEvents {
  ALERT: () => void;
}

interface ClientToServerEvents {
  ALERT: () => void;
}

class SocketServer {
  private io: SocketIOServer<ServerToClientEvents, ClientToServerEvents>;
  private app: Application;

  constructor(server: HttpServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: ["http://localhost:5173", "http://localhost:3000"],
        methods: ["GET", "POST", "PUT", "DELETE"],
        credentials: true,
      },
      cookie: {
        name: "io",
        path: "/",
        httpOnly: true,
        sameSite: "lax",
      },
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
    console.log(`Client connected: ${user.name}`);
    socket.on("disconnect", () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  };
}

export default SocketServer;
