const mongoose = require("mongoose");

// This schema stores login tokens that should no longer work.
// When a user logs out, the current token is added here so it cannot be reused.
const blackListTokenSchema = new mongoose.Schema(
  {
    // This block stores the exact JWT string that should be blocked.
    token: {
      type: String,
      required: [true, "token is required to be added to blacklist"],
    },
  },
  {
    // This block adds createdAt and updatedAt dates automatically.
    timestamps: true,
  },
);

// This model lets auth middleware check whether a token has been logged out.
const tokenBlackListModel = mongoose.model(
  "blackListTokens",
  blackListTokenSchema,
);

// This export shares the blacklist model with auth and logout code.
module.exports = tokenBlackListModel;
