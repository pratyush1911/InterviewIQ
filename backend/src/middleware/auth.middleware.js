const jwt = require("jsonwebtoken");
const tokenBlackListModel = require("../models/blacklist.model");

// This middleware protects private API routes.
// It checks the login cookie before allowing the website to load user-only data.
async function authUser(req, res, next) {
  // This block reads the token cookie that was created during login.
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({
      msg: "Token not provided",
    });
  }

  // This block rejects tokens that were logged out earlier.
  const isTokenBlackListed = await tokenBlackListModel.findOne({
    token,
  });

  if (isTokenBlackListed) {
    return res.status(401).json({
      msg: "Token is invalid",
    });
  }

  try {
    // This block verifies the token and attaches the user data to req.user.
    // Controllers later use req.user.id to fetch only this user's records.
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    // This block handles fake, expired, or damaged tokens.
    return res.status(401).json({
      msg: "Invalid Token",
    });
  }
}

// This export lets route files add authUser before private controllers.
module.exports = { authUser };
