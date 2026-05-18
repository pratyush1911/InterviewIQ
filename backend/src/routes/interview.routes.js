const express = require("express");
const authMiddleware = require("../middleware/auth.middleware");
const interviewController = require("../controllers/interview.controller");
const upload = require("../middleware/file.middleware");

// This router groups all resume-to-report endpoints under /api/interview.
const interviewRouter = express.Router();

// This route accepts a resume PDF plus form fields and creates an AI report.
// It is protected, so only logged-in users can generate reports.
interviewRouter.post(
  "/",
  authMiddleware.authUser,
  upload.single("resume"),
  interviewController.generateInterviewReportController,
);

// This route fetches one saved report by ID for the report page.
interviewRouter.get(
  "/:interviewId",
  authMiddleware.authUser,
  interviewController.getInterviewReportByIdController,
);

// This route fetches a list of saved reports for the logged-in user.
interviewRouter.get(
  "/",
  authMiddleware.authUser,
  interviewController.getInterviewReportsController,
);

// This export lets app.js mount these routes at /api/interview.
module.exports = interviewRouter;
