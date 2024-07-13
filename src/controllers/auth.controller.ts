import { NextFunction, Request, Response } from "express";
import { fieldValidateError } from "../helper/fieldValidation.helper";
import { body } from "express-validator";
import { NotAcceptable, Conflict, NotFound } from "http-errors";
import { UserSchema } from "../models";
import { EncryptAndDecryptService } from "../services/hash.service";
import EmailService from "../services/mail.service";
import { generateOtp, generateSlugName } from "../utils";
import JwtService from "../services/jwt.service";
import MIDDLEWARE_OTP_TYPE from "../types/otp";
import { MIDDLEWARE_REQUEST_TYPE } from "../types/global";
import USER_TYPE from "../types/user";

class AuthController {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, email, password, confirmPassword } = req.body;

      console.log({ name, email, password, confirmPassword });
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

      const hashPassword = await new EncryptAndDecryptService().hashPassword(
        password
      );
      const otp = generateOtp();
      const hashOtp = await new EncryptAndDecryptService().hashPassword(otp);
      const otpExpire = new Date();
      otpExpire.setMinutes(otpExpire.getMinutes() + 2); // 2 minutes

      // generating slug name
      const slugName = generateSlugName(name);

      // create user
      const registerUser = await UserSchema.create({
        name,
        email,
        password: hashPassword,
        slugName,
        hashOtp,
        otpExpire,
      });

      //credentials
      const credential = JSON.stringify({
        userId: registerUser.id,
      });

      // generating otp token
      const OtpToken = await new JwtService().otpTokenGenerator(credential);

      //send mail
      const subject = "OTP for your mail verification";

      await new EmailService().emailSend({
        email,
        subject,
        message: `Hi <b>${name}</b> 
        Your One Time Password for forgot password is <b>
        ${otp}</b>. Remember your OTP will be expired in 
        <b>2 minutes</b>`,
      });

      res.json({
        success: true,
        msg: "You have register successfully, please check your mail for otp verification",
        data: registerUser,
        token: OtpToken,
      });
    } catch (error) {
      console.log({ error });
      next(error);
    }
  }
  async verifyOtpAndLogin(
    req: MIDDLEWARE_OTP_TYPE,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { otp } = req.body;
      const id = req.payload?.userId;
      // for request validation
      fieldValidateError(req);

      const user = await UserSchema.findById(id);
      if (!user) throw new NotFound("User not found!");

      const isOtpMatch = user.hashOtp
        ? await new EncryptAndDecryptService().matchPassword(otp, user.hashOtp)
        : undefined;
      if (!isOtpMatch) throw new NotAcceptable("Your Otp is Incorrect");

      const expire = user.otpExpire;
      if (expire && new Date(expire) < new Date()) {
        user.hashOtp = undefined;
        user.otpExpire = undefined;
        user.save();
        throw new NotAcceptable("Your OTP is expired");
      }

      //credentials
      const credential = JSON.stringify({
        userId: user.id,
        role: user.role,
        name: user.name,
        isBlocked: user.isBlocked,
      });

      // generating access token
      const accessToken = await new JwtService().generateAccessToken(
        credential
      );
      const refreshToken = await new JwtService().generateRefreshToken(
        credential
      );

      user.isVerified = true;
      user.hashOtp = undefined;
      user.otpExpire = undefined;
      user.refreshToken = refreshToken;
      user.save();

      res.json({
        success: true,
        msg: "You are logged in successfully...",
        accessToken,
        user,
      });
    } catch (error) {
      next(error);
    }
  }
  async resendOtp(req: MIDDLEWARE_OTP_TYPE, res: Response, next: NextFunction) {
    try {
      const id = req.payload?.userId;
      const user = await UserSchema.findById(id);
      if (!user) throw new NotFound("User not found!!");

      // check your old otp is expired or not
      const expire = user.otpExpire;
      if (expire && new Date(expire) > new Date())
        throw new NotAcceptable(
          "Your Otp is not expired please enter your otp"
        );

      const otp = generateOtp();
      const hashOtp = await new EncryptAndDecryptService().hashPassword(otp);
      const otpExpire = new Date();
      otpExpire.setMinutes(otpExpire.getMinutes() + 2); // 2 minutes

      // Update user with new otp
      await UserSchema.findByIdAndUpdate(
        id,
        { hashOtp, otpExpire },
        { new: true }
      );

      // send email
      await new EmailService().emailSend({
        email: user.email,
        subject: "To Verify Your Account",
        message: `Hi <b style = {{fontSize: "1rem"}}>${user.name}</b> Your One Time Password for forgot password is <b style = {{fontSize: "1rem"}}>${otp}</b>. Remember your OTP will be expired in <b>2 minutes</b>`,
      });

      res.json({
        success: true,
        msg: "OTP resend Successfully.. Please check your Email",
      });
    } catch (error) {
      next(error);
    }
  }
  // login with password
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      fieldValidateError(req);

      //check user is exist or not
      const isUserExist = await UserSchema.findOne({
        email,
      }).select("+password");

      if (!isUserExist) throw new NotFound("No user found!!");

      // check is verified user or not
      if (!isUserExist.isVerified)
        throw new NotAcceptable("You are not a verified user");
      if (isUserExist.isBlocked) throw new NotAcceptable("You are  blocked");

      //check password
      const isPasswordMatch = isUserExist.password
        ? await new EncryptAndDecryptService().matchPassword(
            password,
            isUserExist.password
          )
        : undefined;

      if (!isPasswordMatch)
        throw new NotAcceptable("email or password is incorrect!!");

      const credential = JSON.stringify({
        userId: isUserExist.id,
        role: isUserExist.role,
        name: isUserExist.name,
        isBlocked: isUserExist.isBlocked,
      });

      // generating access token
      const accessToken = await new JwtService().generateAccessToken(
        credential
      );
      const refreshToken = await new JwtService().generateRefreshToken(
        credential
      );

      //update refresh token in user
      await UserSchema.findByIdAndUpdate(isUserExist.id, {
        refreshToken: refreshToken,
      });

      res.json({
        success: true,
        accessToken,
        message: `${isUserExist.name} You are logged in successfully...`,
      });
    } catch (error) {
      next(error);
    }
  }

  // forgot password
  async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;
      fieldValidateError(req);

      const user = await UserSchema.findOne({
        email,
      });

      if (!user) throw new NotFound("User not found!!");
      if (!user.isVerified)
        throw new NotAcceptable("You are not a verified user");
      if (user.isBlocked) throw new NotAcceptable("You are  blocked");

      let otp = generateOtp();
      const hashOtp = await new EncryptAndDecryptService().hashPassword(otp);
      const otpExpire = new Date();
      otpExpire.setMinutes(otpExpire.getMinutes() + 2); // 2minutes

      await UserSchema.findByIdAndUpdate(
        user.id,
        { hashOtp, otpExpire },
        { new: true }
      );

      //credentials
      const credential = JSON.stringify({
        userId: user.id,
      });

      // generating otp token
      const OtpToken = await new JwtService().otpTokenGenerator(credential);

      //send otp to register user email
      await new EmailService().emailSend({
        email: user.email,
        subject: "To Verify Your Account",
        message: `Hi <b style = {{fontSize: "1rem"}}>${user.name}</b> Your One Time Password for forgot password is <b style = {{fontSize: "1rem"}}>${otp}</b>. Remember your OTP will be expired in <b>2 minutes</b>`,
      });

      res.json({
        success: true,
        message:
          "OTP send successfully to your Email to verify your account please check your email..",
        OtpToken,
      });
    } catch (error) {
      next(error);
    }
  }

  // update password
  async updatePassword(
    req: MIDDLEWARE_OTP_TYPE,
    res: Response,
    next: NextFunction
  ) {
    try {
      const id = req.payload?.userId;
      const { otp, password, confirmPassword } = req.body;
      fieldValidateError(req);

      const user = await UserSchema.findById(id);
      if (!user) throw new NotFound("User not found!");

      const isOtpMatch = user.hashOtp
        ? await new EncryptAndDecryptService().matchPassword(otp, user.hashOtp)
        : undefined;
      if (!isOtpMatch) throw new NotAcceptable("Your Otp is Incorrect");

      if (password !== confirmPassword)
        throw new NotAcceptable("Password and confirmPassword does not match");

      const expire = user.otpExpire;
      if (expire && new Date(expire) < new Date()) {
        user.hashOtp = undefined;
        user.otpExpire = undefined;
        user.save();
        throw new NotAcceptable("Your OTP is expired");
      }

      const hashPassword = await new EncryptAndDecryptService().hashPassword(
        password
      );

      await UserSchema.findByIdAndUpdate(
        user.id,
        {
          password: hashPassword,
          hashOtp: undefined,
          hashOtpExpire: undefined,
        },
        { new: true }
      );

      res.json({
        success: true,
        message:
          "Password updated successfully. Now you can login with your new password!!",
      });
    } catch (error) {
      next(error);
    }
  }

  //self data
  async getSelf(
    req: MIDDLEWARE_REQUEST_TYPE,
    res: Response,
    next: NextFunction
  ) {
    try {
      const id = req.payload?.userId;
      if (!id) throw new NotFound("User not found!!");
      const user = await UserSchema.findById(id);
      if (!user) throw new NotFound("User not found!!");
      res.json({
        success: true,
        message: "Getting user info successfully...",
        user,
      });
    } catch (error) {
      next(error);
    }
  }

  //update profile
  async updateProfile(
    req: MIDDLEWARE_REQUEST_TYPE,
    res: Response,
    next: NextFunction
  ) {
    try {
      const data: USER_TYPE = req.body;
      const id = req.payload?.userId;
      if (
        data.password ||
        data.slugName ||
        data.role ||
        data.isBlocked ||
        data.isVerified
      )
        throw new NotAcceptable("You could not update these credentials");
      fieldValidateError(req);

      const profile: any = req?.files?.profile;
      const user = await UserSchema.findById(id);
      if (!user) throw new NotFound("User not found");
      //profile picture upload
      // const profileInfo = profile
      //   ? await new MediaStoreService().update({
      //       publicId: user && user.profilePath ? user.profilePath : undefined,
      //       files: profile,
      //       folder: "Profiles",
      //     })
      //   : undefined;

      const realData = {
        ...data,
        slugName: data.name ? generateSlugName(data.name) : user.slugName,
        // profilePath: profileInfo?.public_id,
        // profileUrl: profileInfo?.url,
      };

      const updatedData = await UserSchema.findByIdAndUpdate(id, realData, {
        new: true,
      });

      res.json({
        success: true,
        message: "Your profile has been updated...",
        data: updatedData,
      });
    } catch (error) {
      next(error);
    }
  }

  // change password
  async changePassword(
    req: MIDDLEWARE_REQUEST_TYPE,
    res: Response,
    next: NextFunction
  ) {
    try {
      const id = req.payload?.userId;
      const { oldPassword, newPassword, confirmPassword } = req.body;
      if (newPassword !== confirmPassword)
        throw new Conflict("newPassword and confirmPassword are not matched");

      const user = await UserSchema.findById(id).select("+password");
      if (!user) throw new NotFound("User not found!!");

      const isPasswordMatch = user.password
        ? await new EncryptAndDecryptService().matchPassword(
            oldPassword,
            user.password
          )
        : undefined;

      if (!isPasswordMatch)
        throw new NotAcceptable("Please enter valid password");

      const hashPassword = await new EncryptAndDecryptService().hashPassword(
        newPassword
      );

      const updatedUserWithNewPassword = await UserSchema.findByIdAndUpdate(
        user.id,
        { password: hashPassword },
        { new: true }
      );

      res.json({
        success: true,
        data: updatedUserWithNewPassword,
        message: "Password changed successfully...",
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
  verifyOtpAndLogin: [
    body("otp")
      .notEmpty()
      .withMessage("otp is required")
      .isString()
      .withMessage("otp must be string value"),
  ],
  login: [
    body("email")
      .notEmpty()
      .withMessage("email is required")
      .isEmail()
      .withMessage("email must be a valid email address"),
    body("password").notEmpty().withMessage("password is required"),
  ],
  forgotPassword: [
    body("email")
      .notEmpty()
      .withMessage("email is required")
      .isEmail()
      .withMessage("email must be a valid email address"),
  ],
  updatePassword: [
    body("otp")
      .notEmpty()
      .withMessage("otp is required")
      .isString()
      .withMessage("otp must be a string"),
    body("password")
      .not()
      .isEmpty()
      .withMessage("Password is required")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters long.")
      .bail()
      .matches(/[A-Z]/)
      .withMessage("Password must contain at least one Capital letter")
      .bail()
      .matches(/\d/)
      .withMessage("Password must contain at least one digit")
      .bail()
      .matches(/[!@#$%^&*(),.?":{}|<>]/)
      .withMessage("Password must contain at least one special character"),
  ],
  updateProfile: [
    body("name").optional().isString().withMessage("String must be a string"),
    body("email").optional().isEmail().withMessage("Invalid email"),
    body("phone")
      .optional()
      .isMobilePhone("any")
      .withMessage("Invalid phone number"),
    body("countryCode")
      .optional()
      .isString()
      .withMessage("country code must be a string"),
  ],
  changePassword: [
    body("oldPassword")
      .notEmpty()
      .withMessage("oldPassword is required")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters long.")
      .bail()
      .matches(/[A-Z]/)
      .withMessage("Password must contain at least one Capital letter")
      .bail()
      .matches(/\d/)
      .withMessage("Password must contain at least one digit")
      .bail()
      .matches(/[!@#$%^&*(),.?":{}|<>]/)
      .withMessage("Password must contain at least one special character"),
    body("newPassword")
      .notEmpty()
      .withMessage("oldPassword is required")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters long.")
      .bail()
      .matches(/[A-Z]/)
      .withMessage("Password must contain at least one Capital letter")
      .bail()
      .matches(/\d/)
      .withMessage("Password must contain at least one digit")
      .bail()
      .matches(/[!@#$%^&*(),.?":{}|<>]/)
      .withMessage("Password must contain at least one special character"),
  ],
};

export default AuthController;
