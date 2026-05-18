const express = require("express");
const cookieparser = require("cookie-parser");
const cors = require("cors");
const { configurePassport, passport } = require("./config/passport");

const app = express();

configurePassport();

app.use(express.json());
app.use(cookieparser());
app.use(passport.initialize());

const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.options(/.*/, cors());
const authRouter = require("./routes/auth.route");
const interviewRouter = require("./routes/interview.routes");
const liveInterviewRouter = require("./routes/liveInterview.routes");

app.use("/api/auth", authRouter);
app.use("/api/interview", interviewRouter);
app.use("/api/live-interview", liveInterviewRouter);

module.exports = app;