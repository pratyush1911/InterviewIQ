const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const userModel = require("../models/user.model");

// This block checks whether Google sign-in can run.
// If either credential is missing, the website should show a friendly login error.
const isGoogleOAuthConfigured = () =>
  Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

// This function teaches Passport how to handle Google OAuth login.
function configurePassport() {
  // This block avoids crashing the app when Google credentials are not set yet.
  if (!isGoogleOAuthConfigured()) {
    return;
  }

  // This block registers the Google strategy.
  // A strategy is Passport's name for "how to log in with this provider."
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL:
          process.env.GOOGLE_CALLBACK_URL ||
          "http://localhost:3000/api/auth/google/callback",
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // This block reads the Google profile and chooses a username.
          const email = profile.emails?.[0]?.value;
          const displayName = profile.displayName || email?.split("@")[0];

          // This block rejects Google accounts that do not share an email.
          if (!email) {
            return done(null, false, {
              message: "Google account did not provide an email address",
            });
          }

          // This block looks for an existing user by Google ID or email.
          let user = await userModel.findOne({
            $or: [{ googleId: profile.id }, { email }],
          });

          // This block creates a new account for first-time Google users.
          if (!user) {
            user = await userModel.create({
              googleId: profile.id,
              username: `${displayName || "google-user"}-${profile.id.slice(-6)}`,
              email,
              authProvider: "google",
            });
          // This block links Google sign-in to an existing email/password account.
          } else if (!user.googleId) {
            user.googleId = profile.id;
            user.authProvider = "google";
            await user.save();
          }

          // This line tells Passport that login succeeded and passes the user forward.
          return done(null, user);
        } catch (err) {
          // This line gives unexpected OAuth errors back to Passport.
          return done(err);
        }
      },
    ),
  );
}

// This export lets routes use Passport and lets controllers check OAuth readiness.
module.exports = {
  configurePassport,
  isGoogleOAuthConfigured,
  passport,
};
