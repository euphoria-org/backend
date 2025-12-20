require("dotenv").config();

const express = require("express");
const session = require("express-session");
const passport = require("./config/passport");
const app = express();
const connectDB = require("./config/database");

app.use(express.json());
const cors = require("cors");

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
  "https://delightful-bay-07530dc00.4.azurestaticapps.net",
  "https://wonderful-wave-0b94bee00.2.azurestaticapps.net",
];

if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}
if (process.env.ADMIN_URL) {
  allowedOrigins.push(process.env.ADMIN_URL);
}

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);

      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        if (
          process.env.NODE_ENV !== "production" &&
          origin.includes("localhost")
        ) {
          callback(null, true);
        } else {
          callback(new Error("Not allowed by CORS"));
        }
      }
    },
    credentials: true,
  })
);

app.use(
  session({
    secret: process.env.JWT_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false,
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

const MBTIRouter = require("./routes/MBTIRouter");
const AdminRouter = require("./routes/AdminRouter");
const UserRouter = require("./routes/UserRouter");
const ChatBotRouter = require("./routes/ChatBotRouter");
const PERMARouter = require("./routes/PERMARouter");
const IQRouter = require("./routes/IQRouter");

const port = process.env.PORT || 8080;
connectDB();

app.use("/api/mbti", MBTIRouter);
app.use("/api/admin", AdminRouter);
app.use("/api/user", UserRouter);
app.use("/api/chatbot", ChatBotRouter);
app.use("/api/perma", PERMARouter);
app.use("/api/iq", IQRouter);

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  app.get(
    "/auth/google",
    passport.authenticate("google", {
      scope: ["profile", "email"],
    })
  );

  app.get(
    "/auth/google/callback",
    passport.authenticate("google", { failureRedirect: "/auth/failure" }),
    (req, res) => {
      try {
        const jwt = require("jsonwebtoken");
        const token = jwt.sign({ id: req.user._id }, process.env.JWT_SECRET, {
          expiresIn: process.env.JWT_EXPIRES_IN || "7d",
        });

        let redirectUrl = process.env.FRONTEND_URL || "http://localhost:5175";

        const referrer = req.get("Referrer") || req.get("Origin");
        const returnTo = req.query.state;

        if (
          referrer &&
          (referrer.includes("admin") || referrer.includes("5174"))
        ) {
          redirectUrl = process.env.ADMIN_URL || "http://localhost:5174";
        }

        if (returnTo && returnTo.includes("admin")) {
          redirectUrl = process.env.ADMIN_URL || "http://localhost:5174";
        }

        res.redirect(`${redirectUrl}/auth/success?token=${token}`);
      } catch (error) {
        const fallbackUrl = process.env.FRONTEND_URL || "http://localhost:5175";
        res.redirect(`${fallbackUrl}/login?error=server_error`);
      }
    }
  );

  app.get("/auth/failure", (req, res) => {
    let redirectUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const referrer = req.get("Referrer") || req.get("Origin");

    if (referrer && (referrer.includes("admin") || referrer.includes("5174"))) {
      redirectUrl = process.env.ADMIN_URL || "http://localhost:5174";
    }

    res.redirect(`${redirectUrl}/login?error=google_auth_failed`);
  });
} else {
  app.get("/auth/google", (req, res) => {
    res.status(503).json({
      success: false,
      message:
        "Google OAuth is not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in environment variables.",
      redirectUrl: `${
        process.env.FRONTEND_URL || "http://localhost:5175"
      }/login?error=oauth_not_configured`,
    });
  });

  app.get("/auth/google/callback", (req, res) => {
    const redirectUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    res.redirect(`${redirectUrl}/login?error=oauth_not_configured`);
  });

  app.get("/auth/failure", (req, res) => {
    const redirectUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    res.redirect(`${redirectUrl}/login?error=oauth_not_configured`);
  });
}

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString(),
  });
});

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString(),
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

app.listen(port, () => {});

module.exports = app;
