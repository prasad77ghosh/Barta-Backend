import express, { Application } from "express";
import { DataBase } from "./db";
import { createServer } from "http";
import path from "path";
import fs from "fs";

class App {
  public app: Application;
  constructor() {
    this.app = express();
    DataBase.connect();
  }

  public listen(serverPort: number) {
    const options = {};
    const server = createServer(options, this.app);
    server.listen(serverPort, (): void => {
      console.log(`Listening on ${serverPort}...`);
      const middlewares = fs.readdirSync(path.join(__dirname, "/middlewares"));
      // console.log({ middlewares });
      this.middleware(middlewares, "top."); // top middleware
      this.middleware(middlewares, "bottom.");
    });
  }

  private middleware(middlewares: any[], str: "bottom." | "top.") {
    middlewares.forEach((middleware) => {
      if (middleware.includes(str)) {
        // console.log(path.join(__dirname + "/middlewares/" + middleware));
        import(path.join(__dirname + "/middlewares/" + middleware)).then(
          (middleReader) => {
            // console.log({ middleReader });
            new middleReader.default(this.app);
          }
        );
      }
    });
  }
}

export default App;
