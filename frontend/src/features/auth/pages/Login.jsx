import { useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { API_BASE_URL } from "../../../lib/api";
import { useAuth } from "../hooks/useAuth";
import "../auth.form.scss";

// This component renders the login page and connects it to the backend.
const Login = () => {
  // This block gets helpers for login and navigation.
  const { handleLogin } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const oauthError = searchParams.get("authError");

  // These state blocks remember what the user has typed into the form.
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // This state stores login errors so the page can show them under the form.
  const [error, setError] = useState(
    oauthError === "google_oauth_not_configured"
      ? "Google sign-in needs OAuth credentials before it can be used."
      : oauthError
        ? "Google sign-in could not be completed."
        : "",
  );
  // This state disables the form while the request is running.
  const [isSubmitting, setIsSubmitting] = useState(false);

  // This block runs when the user submits the login form.
  const handleSubmit = async (e) => {
    // This stops the browser from refreshing the page.
    e.preventDefault();
    if (isSubmitting) {
      return;
    }

    setError("");
    setIsSubmitting(true);

    // This block asks useAuth to call the backend login API.
    const result = await handleLogin({ email, password });
    setIsSubmitting(false);

    // This block moves the user to the dashboard after a successful login.
    if (result.success) {
      navigate("/");
    } else {
      setError(result.message);
    }
  };

  // This block starts the Google OAuth login by navigating to the backend route.
  const handleGoogleSignIn = () => {
    window.location.href = `${API_BASE_URL}/api/auth/google`;
  };

  // This return block is the HTML-like JSX that appears on the login page.
  return (
    <main className="auth-page">
      <div className="form-container">
        <h1>Login</h1>
        <button
          className="oauth-button"
          type="button"
          onClick={handleGoogleSignIn}
          aria-label="Continue with Google"
        >
          <span className="oauth-button__mark">G</span>
          <span>Continue with Google</span>
        </button>
        <div className="auth-divider">
          <span>or</span>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="email">Email</label>
            <input
              value={email}
              disabled={isSubmitting}
              onChange={(e) => {
                setEmail(e.target.value);
              }}
              type="email"
              id="email"
              name="email"
              placeholder="Enter email Address"
            />
          </div>
          <div className="input-group">
            <label htmlFor="password">Password</label>
            <input
              value={password}
              disabled={isSubmitting}
              onChange={(e) => {
                setPassword(e.target.value);
              }}
              type="password"
              id="password"
              name="password"
              placeholder="Enter password"
            />
          </div>
          <button
            className="button primary-button"
            disabled={isSubmitting}
            aria-busy={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className="button-spinner" aria-hidden="true" />
                <span>Logging in...</span>
              </>
            ) : (
              "Login"
            )}
          </button>
        </form>
        {error && <p className="form-error">{error}</p>}
        <p>
          Don't have an account?<Link to={"/register"}>Register</Link>
        </p>
      </div>
    </main>
  );
};

// This export lets the router show the Login page at /login.
export default Login;
