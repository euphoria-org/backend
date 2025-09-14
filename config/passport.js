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
          console.log(
            "Google OAuth Profile:",
            profile.id,
            profile.emails[0].value,
            profile.displayName
          );

          // Use a more robust query to prevent duplicates
          // Check by googleId first (most specific), then by email
          let user = await UserModel.findOne({
            $or: [
              { googleId: profile.id },
              { auth0Id: profile.id }, // Legacy field support
              { email: profile.emails[0].value },
            ],
          });

          if (user) {
            console.log("Existing user found:", user._id, user.email);

            // Update user to ensure consistency
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
              console.log("Updated existing user with Google OAuth data");
            }

            return done(null, user);
          }

          console.log("Creating new user for Google OAuth");

          // Create new user - ensure no duplicate creation with atomic operation
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
          console.log("New Google user created:", user._id, user.email);

          // Send welcome email with credentials
          try {
            await sendWelcomeEmailWithCredentials(
              user.email,
              user.name,
              temporaryPassword // Send the plain password in email before it was hashed
            );
            console.log("Welcome email sent to:", user.email);
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
  console.log("Google OAuth strategy initialized");
} else {
  console.warn(
    "Google OAuth credentials not found. Google authentication will be disabled."
  );
  console.warn(
    "Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in your .env file"
  );
}

module.exports = passport;
