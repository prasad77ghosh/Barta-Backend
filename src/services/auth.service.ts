import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import {
  GoogleCallbackUrl,
  GoogleClientId,
  GoogleClientSecret,
} from "../configs";
import { UserSchema } from "../models";

import { InternalServerError } from "http-errors";
import USER_TYPE from "../types/user";

export default class PassportService {
  static initialize(passport: passport.PassportStatic) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: GoogleClientId,
          clientSecret: GoogleClientSecret,
          callbackURL: GoogleCallbackUrl,
        },
        async (accessToken, refreshToken, profile, done) => {
          const newUser = {
            googleId: profile.id,
            displayName: profile.displayName,
            firstName: profile.name?.givenName,
            lastName: profile.name?.familyName,
            email: profile.emails?.[0].value,
            // image: profile.photos?.[0].value,
          };

          try {
            let user = await UserSchema.findOne({ googleId: profile.id });
            if (user) {
              done(null, user);
            } else {
              user = await UserSchema.create({
                email: profile.emails?.[0].value,
                name: `${profile.name?.givenName} ${profile.name?.familyName}`,
                googleId: profile.id,
              });
              done(null, user);
            }
          } catch (error: any) {
            throw new InternalServerError(error);
          }
        }
      )
    );

    passport.serializeUser((user, done) => {
      done(null, (user as any).id);
    });

    passport.deserializeUser((id, done) => {
      UserSchema.findById(id, (err: any, user: any) => done(err, user));
    });
  }
}
