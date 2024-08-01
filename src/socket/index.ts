import { Server as HttpServer } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";
import express, { Application, NextFunction, Request, Response } from "express";
import cookieParser from "cookie-parser";
import ProtectedMiddleware from "../middlewares/protected.middleware";

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
        origin: "*",
      },
    });
    this.app = express();

    this.app.set("io", this.io);

    // socket middleware
    this.io.use((socket, next) => {
      cookieParser()(
        socket.request as Request,
        (socket.request as Request).res as Response,
        async (err) =>
          new ProtectedMiddleware().socketAuthenticator(err, socket, next)
      );
    });
    this.io.on("connection", this.onConnection);
  }

  private onConnection = (
    socket: Socket<ClientToServerEvents, ServerToClientEvents>
  ) => {
    console.log(`Client connected: ${socket.id}`);

    socket.on("disconnect", () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  };
}

export default SocketServer;
