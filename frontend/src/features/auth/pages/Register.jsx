import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { API_BASE_URL } from "../../../lib/api";
import { useAuth } from "../hooks/useAuth";
import "../auth.form.scss";

// This component renders the registration page.
const Register = () => {
  // This hook lets the page move to the dashboard after account creation.
  const navigate = useNavigate();

  // These state blocks store the current form input values.
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // This state stores registration errors for the page to display.
  const [error, setError] = useState("");
  // This state prevents double-submitting while the backend request is running.
  const [isSubmitting, setIsSubmitting] = useState(false);

  // This helper comes from the shared auth hook.
  const { handleRegister } = useAuth();

  // This block runs when the user submits the register form.
  const handleSubmit = async (e) => {
    // This prevents the browser from doing a normal page reload.
    e.preventDefault();
    if (isSubmitting) {
      return;
    }

    setError("");
    setIsSubmitting(true);

    // This block sends the new account data to the backend.
    const result = await handleRegister({ username, email, password });
    setIsSubmitting(false);

    // This block sends successful users to the dashboard and shows errors otherwise.
    if (result.success) {
      navigate("/");
    } else {
      setError(result.message);
    }
  };

  // This block starts Google signup/login through the backend OAuth route.
  const handleGoogleSignIn = () => {
    window.location.href = `${API_BASE_URL}/api/auth/google`;
  };

  // This return block is the JSX that draws the registration form.
  return (
    <main className="auth-page">
      <div className="form-container">
        <h1>Register</h1>
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
            <label htmlFor="username">username</label>
            <input
              value={username}
              disabled={isSubmitting}
              onChange={(e) => {
                setUsername(e.target.value);
              }}
              type="text"
              id="username"
              name="username"
              placeholder="Enter username"
            />
          </div>
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
                <span>Creating...</span>
              </>
            ) : (
              "Register"
            )}
          </button>
        </form>
        {error && <p className="form-error">{error}</p>}
        <p>
          Already have an account?<Link to={"/login"}>Login</Link>
        </p>
      </div>
    </main>
  );
};

// This export lets the router show the Register page at /register.
export default Register;
