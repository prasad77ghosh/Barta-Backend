import { NextFunction, Request, Response } from "express";
import { fieldValidateError } from "../helper/fieldValidation.helper";
import { body } from "express-validator";
import { NotAcceptable } from "http-errors";

class AuthController {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, email, password, confirmPassword } = req.body;
      // validate req body
      fieldValidateError(req);
      const profile = req?.files?.profile;

      res.json({
        success: true,
        message: `${name}-${email}-${password}-${confirmPassword}`,
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
      .isLength({ min: 8 })
      .matches("/^(?=.*[A-Z])(?=.*[a-z])(?=.*d)(?=.*[W_]).{8,}$/")
      .withMessage(
        "password must be at least 8 characters and its must contain one capital letter, one special character and one number"
      ),
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
