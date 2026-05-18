const userModel = require("../models/user.model");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const tokenBlackListModel = require("../models/blacklist.model");
const { isGoogleOAuthConfigured } = require("../config/passport");

// These cookie options control how the login token is stored in the browser.
// httpOnly helps protect the token from frontend JavaScript.
const authCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
};

// This is the frontend URL used when the backend redirects after Google login.
const clientUrl = process.env.CLIENT_URL || "http://127.0.0.1:5173";

// This function creates the JWT login token.
// The token stores only basic user identity and expires after one day.
function createAuthToken(user) {
  return jwt.sign(
    {
      id: user._id,
      username: user.username,
    },
    process.env.JWT_SECRET,
    { expiresIn: "1d" },
  );
}

// This helper places the JWT inside a browser cookie after login/register.
function setAuthCookie(res, token) {
  res.cookie("token", token, {
    ...authCookieOptions,
    maxAge: 24 * 60 * 60 * 1000,
  });
}

// This helper sends the user back to the login page with a readable OAuth error.
function redirectWithAuthError(res, code) {
  res.redirect(`${clientUrl}/login?authError=${encodeURIComponent(code)}`);
}

// This controller handles the register form from the website.
async function registerUserController(req, res) {
  try {
    // This block reads the values the React form sent to the API.
    const { username, email, password } = req.body;

    // This block validates required fields before touching the database.
    if (!username || !email || !password) {
      return res.status(400).json({
        msg: "please provide username email and password",
      });
    }

    // This block prevents duplicate usernames or emails.
    const isUserAlrExist = await userModel.findOne({
      $or: [{ username }, { email }],
    });
    if (isUserAlrExist) {
      return res.status(400).json({
        msg: "Account already exists with this email or username",
      });
    }
    // This block hashes the password and saves the new user.
    // Hashing means the real password is never stored as plain text.
    const hash = await bcrypt.hash(password, 10);
    const user = await userModel.create({
      username,
      email,
      password: hash,
    });
    // This block logs the user in immediately after account creation.
    const token = createAuthToken(user);
    setAuthCookie(res, token);
    res.status(201).json({
      msg: "User Created Successfully",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (err) {
    // This block catches unexpected database/server errors.
    res.status(500).json({ msg: "Internal server error" });
  }
}

// This controller handles the login form from the website.
async function loginUserController(req, res) {
  try {
    // This block reads the email and password typed in the React form.
    const { email, password } = req.body;

    // This block validates that the user filled both inputs.
    if (!email || !password) {
      return res.status(400).json({
        msg: "Please provide email and password",
      });
    }

    // This block finds the account by email.
    const user = await userModel.findOne({ email });

    // This block uses the same message for missing users to avoid leaking account info.
    if (!user) {
      return res.status(400).json({
        msg: "Invalid email or password",
      });
    }

    // This block stops Google-only accounts from logging in with a blank password.
    if (!user.password) {
      return res.status(400).json({
        msg: "This account uses Google sign-in",
      });
    }

    // This block compares the typed password to the saved password hash.
    const isPassValid = await bcrypt.compare(password, user.password);

    if (!isPassValid) {
      return res.status(400).json({
        msg: "Invalid email or password",
      });
    }

    // This block creates a fresh login cookie and returns safe user data.
    const token = createAuthToken(user);
    setAuthCookie(res, token);
    res.status(200).json({
      msg: "User LoggedIn Successfully",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (err) {
    // This block catches unexpected login errors.
    res.status(500).json({ msg: "Internal server error" });
  }
}

// This controller runs before Google OAuth starts.
// It prevents a broken Google redirect when OAuth credentials are missing.
function googleOAuthStartController(req, res, next) {
  if (!isGoogleOAuthConfigured()) {
    return redirectWithAuthError(res, "google_oauth_not_configured");
  }

  next();
}

// This controller runs after Google sends the user back to the backend.
function googleOAuthCallbackController(req, res) {
  // This block handles a failed Google login result.
  if (!req.user) {
    return redirectWithAuthError(res, "google_oauth_failed");
  }

  // This block creates the same app login cookie used by email/password login.
  const token = createAuthToken(req.user);
  setAuthCookie(res, token);
  res.redirect(clientUrl);
}

// This controller logs the user out.
async function logoutUserController(req, res) {
  try {
    // This block stores the current token in the blacklist so it cannot be reused.
    const token = req.cookies.token;
    if (token) {
      await tokenBlackListModel.create({ token });
    }

    // This block removes the browser cookie from the user.
    res.clearCookie("token", authCookieOptions);
    res.status(200).json({
      msg: "user loggedOut Successfully",
    });
  } catch (err) {
    // This block catches unexpected logout errors.
    res.status(500).json({ msg: "Internal server error" });
  }
}

// This controller returns the currently logged-in user's public profile.
async function getMeController(req, res) {
  try {
    // req.user was added by auth.middleware.js after verifying the cookie.
    const user = await userModel.findById(req.user.id);
    res.status(200).json({
      msg: "User details Fetched Successfully",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (err) {
    // This block catches unexpected profile lookup errors.
    res.status(500).json({ msg: "Internal server error" });
  }
}

// This export lets the auth route file connect URLs to these controller functions.
module.exports = {
  registerUserController,
  loginUserController,
  googleOAuthStartController,
  googleOAuthCallbackController,
  logoutUserController,
  getMeController,
};
