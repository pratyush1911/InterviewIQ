const mongoose = require("mongoose");

// This schema describes one user account in MongoDB.
// The website needs this data for registration, login, and showing the username.
const userSchema = new mongoose.Schema({
  // This block stores the public name shown in the dashboard.
  username: {
    type: String,
    unique: [true, "username already exists"],
    required: true,
  },
  // This block stores the email used for login and Google OAuth matching.
  email: {
    type: String,
    unique: [true, "account already exists with this email address"],
    required: true,
  },
  // This block stores the hashed password for normal email/password users.
  // Google-only users do not need a password, so the required rule is conditional.
  password: {
    type: String,
    required: function requirePasswordForEmailAuth() {
      return !this.googleId;
    },
  },
  // This block stores Google's unique account ID when the user signs in with Google.
  googleId: {
    type: String,
    unique: true,
    sparse: true,
  },
  // This block remembers how the account was created.
  authProvider: {
    type: String,
    enum: ["credentials", "google"],
    default: "credentials",
  },
});

// This model is the object controllers use to create and find users.
const userModel = mongoose.model("users",userSchema);

// This export shares the user model with controllers and Passport config.
module.exports =userModel;
