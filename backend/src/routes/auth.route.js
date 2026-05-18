const express = require("express");
const authController = require("../controllers/auth.controller");
const authMiddleware = require("../middleware/auth.middleware");
const { passport } = require("../config/passport");

// This router groups all authentication endpoints under /api/auth.
const authRouter = express.Router();

// This route creates a new email/password account.
authRouter.post("/register", authController.registerUserController);

// This route logs in an existing email/password account.
authRouter.post("/login", authController.loginUserController);

// This route starts the Google OAuth flow by sending the user to Google.
authRouter.get(
  "/google",
  authController.googleOAuthStartController,
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  }),
);

// This route is where Google redirects the user after Google login succeeds.
authRouter.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/api/auth/google/failed",
    session: false,
  }),
  authController.googleOAuthCallbackController,
);

// This route handles failed Google OAuth attempts and sends the user back to login.
authRouter.get("/google/failed", (req, res) => {
  res.redirect(
    `${process.env.CLIENT_URL || "http://127.0.0.1:5173"}/login?authError=google_oauth_failed`,
  );
});
/**
 * @route GET  /api/auth/logout
 * @description clear token from user cookie and add token in the blacklist
 * @access public
 */
// This route logs the user out by clearing the cookie and blocking the old token.
authRouter.get("/logout", authController.logoutUserController);

// This route returns the currently logged-in user's profile.
authRouter.get("/get-me", authMiddleware.authUser,authController.getMeController);

// This export lets app.js mount all auth routes at /api/auth.
module.exports = authRouter;
