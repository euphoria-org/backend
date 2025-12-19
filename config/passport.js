const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const UserModel = require("../models/UserModel");
const { sendWelcomeEmailWithCredentials } = require("../utils/emailService");
const crypto = require("crypto");

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, user._id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await UserModel.findById(id).select("-password");
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  const getCallbackURL = () => {
    if (process.env.GOOGLE_CALLBACK_URL) {
      return process.env.GOOGLE_CALLBACK_URL;
    }
    if (process.env.NODE_ENV === 'production' && process.env.PRODUCTION_URL) {
      return `${process.env.PRODUCTION_URL}/auth/google/callback`;
    }
    if (process.env.GOOGLE_REDIRECT_URI && !process.env.GOOGLE_REDIRECT_URI.includes('localhost')) {
      return process.env.GOOGLE_REDIRECT_URI;
    }
    return 'https://euphoria-backend-v2-a2cafrgch8azaabh.centralindia-01.azurewebsites.net/auth/google/callback';
  };

  const callbackURL = getCallbackURL();
  console.log('Google OAuth Callback URL:', callbackURL);

  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: callbackURL,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          
          let user = await UserModel.findOne({
            $or: [
              { googleId: profile.id },
              { auth0Id: profile.id }, 
              { email: profile.emails[0].value },
            ],
          });

          if (user) {
          
            let needsUpdate = false;

            if (!user.googleId && profile.id) {
              user.googleId = profile.id;
              needsUpdate = true;
            }

            if (!user.auth0Id && profile.id) {
              user.auth0Id = profile.id;
              needsUpdate = true;
            }

            if (user.authProvider !== "google") {
              user.authProvider = "google";
              needsUpdate = true;
            }

            if (needsUpdate) {
              await user.save();
            }

            return done(null, user);
          }

          const temporaryPassword = crypto.randomBytes(12).toString("hex");

          user = new UserModel({
            googleId: profile.id,
            auth0Id: profile.id, // Keep for backward compatibility
            name:
              profile.displayName ||
              profile.name?.givenName + " " + profile.name?.familyName ||
              "Google User",
            email: profile.emails[0].value,
            password: temporaryPassword, // This will be hashed by the pre-save hook
            authProvider: "google",
            isEmailVerified: true, // Google emails are verified
          });

          await user.save();
          try {
            await sendWelcomeEmailWithCredentials(
              user.email,
              user.name,
              temporaryPassword // Send the plain password in email before it was hashed
            );
          } catch (emailError) {
            console.error("Failed to send welcome email:", emailError);
          }

          return done(null, user);
        } catch (error) {
          console.error("Google OAuth error:", error);
          return done(error, null);
        }
      }
    )
  );
} else {
  console.warn(
    "Google OAuth credentials not found. Google authentication will be disabled."
  );
  console.warn(
    "Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in your .env file"
  );
}

module.exports = passport;
