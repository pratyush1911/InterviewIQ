const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const { configurePassport, passport } = require("./config/passport");

const app = express();

configurePassport();

app.use(express.json());
app.use(cookieParser());
app.use(passport.initialize());

const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "https://interview-iq-ivory.vercel.app", // deployed frontend
  process.env.CLIENT_URL,
].filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (Postman, mobile apps, server-to-server)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

const authRouter = require("./routes/auth.route");
const interviewRouter = require("./routes/interview.routes");
const liveInterviewRouter = require("./routes/liveInterview.routes");

app.use("/api/auth", authRouter);
app.use("/api/interview", interviewRouter);
app.use("/api/live-interview", liveInterviewRouter);

module.exports = app;