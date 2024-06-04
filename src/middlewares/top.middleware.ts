import express, { Application, NextFunction, Request, Response } from "express";
import fileUpload from "express-fileupload";

class TopMiddleWare {
  constructor(app: Application) {
    // handling JSON data
    app.use(express.json());
    // handling file upload in app
    app.use(
      fileUpload({
        useTempFiles: true,
      })
    );
    //handling form data
    app.use(express.urlencoded({ extended: true }));
    //cors
    app.use(this.allowCrossDomain);
  }

  private allowCrossDomain(req: Request, res: Response, next: NextFunction) {
    const allAllowedOrigin: string[] = ["http://localhost:3000"];

    const origin = req.headers.origin as string;
    if (allAllowedOrigin.includes(origin)) {
      res.header("Access-Control-Allow-Origin", origin);
      res.header("Access-Control-Allow-Credentials", "true");
    }

    res.header(
      "Access-Control-Allow-Headers",
      "Access-Control-Allow-Headers, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers,X-Access-Token,XKey,Authorization,X-Otp-Token"
    ); //all headers allowed

    if (req.method === "OPTIONS") {
      res.header(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, PATCH, DELETE"
      ); //all method allowed
      return res.status(200).json({});
    }

    next();
  }
}

export default TopMiddleWare;
