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

// Google OAuth Strategy - only initialize if credentials are provided
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_REDIRECT_URI,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          
          let user = await UserModel.findOne({
            $or: [{ auth0Id: profile.id }, { email: profile.emails[0].value }],
          });

          if (user) {

            if (!user.auth0Id) {
              user.auth0Id = profile.id;
              user.authProvider = "google";
              await user.save();
            }
            return done(null, user);
          }

          // Create new user
          const temporaryPassword = crypto.randomBytes(12).toString("hex");

          user = new UserModel({
            auth0Id: profile.id,
            name: profile.displayName,
            email: profile.emails[0].value,
            password: temporaryPassword, // This will be hashed by the pre-save hook
            authProvider: "google",
            isEmailVerified: true, // Auto-verify Google users
          });

          await user.save();

          // Send welcome email with credentials
          try {
            await sendWelcomeEmailWithCredentials(
              user.email,
              user.name,
              temporaryPassword // Send the plain password in email before it was hashed
            );
          } catch (emailError) {
            console.error("Failed to send welcome email:", emailError);
            // Don't fail the auth process if email fails
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
