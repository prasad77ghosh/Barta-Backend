import { NextFunction, Request, Response } from "express";
import { fieldValidateError } from "../helper/fieldValidation.helper";
import { body } from "express-validator";
import { NotAcceptable, Conflict } from "http-errors";
import { UserSchema } from "../models";
import { HashService } from "../services/hash.service";
import EmailService from "../services/mail.service";
import { generateOtp } from "../utils";

class AuthController {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, email, password, confirmPassword } = req.body;
      // validate req body
      fieldValidateError(req);
      const profile = req?.files?.profile;

      if (password !== confirmPassword)
        throw new NotAcceptable("password and confirmPassword must be equal");
      const isUserExist = await UserSchema.findOne({
        email: email,
      });
      if (isUserExist)
        throw new Conflict("A user already exists with this mail");

      const hashPassword = HashService.hashPassword(password);

      const registerUser = await UserSchema.create({
        name,
        email,
        password: hashPassword,
      });
      //send mail
      const subject = "OTP for your mail verification";

      await new EmailService().emailSend({
        email,
        subject,
        message: `Hi <b>${name}</b> 
        Your One Time Password for forgot password is <b>
        ${generateOtp()}</b>. Remember your OTP will be expired in 
        <b>2 minutes</b>`,
      });

      res.json({
        success: true,
        msg: "You have register successfully, please check your mail for otp verification",
        data: registerUser,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const AuthControllerValidator = {
  registerValidation: [
    body("name")
      .notEmpty()
      .withMessage("name is required")
      .bail()
      .isString()
      .withMessage("name must be string"),
    body("email")
      .notEmpty()
      .withMessage("email is required")
      .bail()
      .isEmail()
      .withMessage("email must be valid mail"),
    body("password")
      .notEmpty()
      .withMessage("password is required")
      .bail()
      .isLength({ min: 8 }),
    // .matches("/^(?=.*[A-Z])(?=.*[a-z])(?=.*d)(?=.*[W_]).{8,}$/")
    // .withMessage(
    //   "password must be at least 8 characters and its must contain one capital letter, one special character and one number"
    // ),
    body("confirmPassword")
      .notEmpty()
      .withMessage("confirmPassword is required")
      .bail()
      .custom((value, { req }) => {
        if (value !== req.body.password) {
          throw new NotAcceptable("Password and confirmPassword doesn't match");
        }
        return true;
      }),
  ],
};

export default AuthController;
