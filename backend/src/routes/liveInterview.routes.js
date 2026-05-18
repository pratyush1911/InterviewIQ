const express = require("express");
const authMiddleware = require("../middleware/auth.middleware");
const liveInterviewController = require("../controllers/liveInterview.controller");

// This router groups live interview endpoints under /api/live-interview.
const liveInterviewRouter = express.Router();

// This route scores one answer during the live interview practice flow.
liveInterviewRouter.post(
  "/evaluate",
  authMiddleware.authUser,
  liveInterviewController.evaluateAnswerController,
);

// This route reviews all submitted answers and creates the final mock decision.
liveInterviewRouter.post(
  "/finalize",
  authMiddleware.authUser,
  liveInterviewController.finalizeInterviewController,
);

// This export lets app.js mount these routes at /api/live-interview.
module.exports = liveInterviewRouter;
