const express = require("express");
const cookieparser = require("cookie-parser");
const cors = require("cors");
const { configurePassport, passport } = require("./config/passport");

// This block creates the Express app, which is the main object that receives
// browser requests and sends responses back to the website.
const app = express();

// This block turns on Google OAuth only when the needed credentials exist.
configurePassport();

// These middleware blocks prepare incoming requests:
// JSON lets the backend read request bodies, cookies lets it read the login token,
// and Passport gives Google sign-in a place to run.
app.use(express.json());
app.use(cookieparser());
app.use(passport.initialize());

// This CORS block allows the React frontend to call this backend while developing.
// `credentials: true` is important because login uses a secure cookie.
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://127.0.0.1:5173",
      process.env.CLIENT_URL,
    ].filter(Boolean),
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// These route imports group related API endpoints into separate files.
const authRouter = require("./routes/auth.route"); // require all the routes here
const interviewRouter = require("./routes/interview.routes");
const liveInterviewRouter = require("./routes/liveInterview.routes");

// These lines mount each route group under a URL prefix.
// For example, the login route becomes /api/auth/login.
app.use("/api/auth", authRouter); // using all the routes here
app.use("/api/interview", interviewRouter);
app.use("/api/live-interview", liveInterviewRouter);

// This export lets server.js start the app and lets tests/tools import it.
module.exports = app;
