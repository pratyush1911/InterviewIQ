import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/hooks/useAuth";
import "./dashboard.scss";

// This component renders the first page a logged-in user sees.
const Dashboard = () => {
  // This block gives the dashboard navigation and user/session helpers.
  const navigate = useNavigate();
  const { user, handleLogout } = useAuth();
  // This state disables the sign-out button while logout is in progress.
  const [signingOut, setSigningOut] = useState(false);

  // This block logs the user out and returns them to the login page.
  const handleSignOut = async () => {
    if (signingOut) {
      return;
    }

    setSigningOut(true);
    const result = await handleLogout();
    setSigningOut(false);

    if (result.success) {
      navigate("/login");
    }
  };

  // This return block draws the dashboard cards and sign-out button.
  return (
    <main className="dashboard-page">
      {/* These decorative layers create the page background. */}
      <div className="ambient ambient--primary" />
      <div className="ambient ambient--secondary" />
      <div className="noise-overlay" />

      <section className="dashboard-shell">
        {/* This header greets the user and gives them a logout action. */}
        <header className="dashboard-header">
          <div>
            <p className="dashboard-eyebrow">Interview Prep Command Center</p>
            <h1>Welcome back, {user?.username || "candidate"}.</h1>
          </div>
          <button
            className="signout-button"
            type="button"
            onClick={handleSignOut}
            disabled={signingOut}
            aria-busy={signingOut}
          >
            {signingOut ? (
              <>
                <span className="button-spinner" aria-hidden="true" />
                <span>Signing out...</span>
              </>
            ) : (
              "Sign out"
            )}
          </button>
        </header>

        {/* This grid contains the main actions users can choose from. */}
        <div className="dashboard-grid">
          <button
            className="dashboard-card dashboard-card--primary"
            type="button"
            onClick={() => navigate("/prepare")}
          >
            <span className="dashboard-card__icon">01</span>
            <span className="dashboard-card__label">Resume Match Lab</span>
            <strong>Generate tailored questions from your resume and a job post.</strong>
            <span className="dashboard-card__action">Open generator</span>
          </button>

          <button
            className="dashboard-card"
            type="button"
            onClick={() => navigate("/live-interview")}
          >
            <span className="dashboard-card__icon">02</span>
            <span className="dashboard-card__label">Live Interview</span>
            <strong>Practice with an AI voice interviewer and get a selection verdict.</strong>
            <span className="dashboard-card__action">Start practice</span>
          </button>

          {/* This panel explains current app readiness items on the dashboard. */}
          <div className="dashboard-panel">
            <span className="dashboard-card__label">Production Readiness</span>
            <ul>
              <li>Google OAuth scaffold is ready for credentials.</li>
              <li>Voice interview uses microphone transcript fallback.</li>
              <li>Gemini evaluates answers server-side.</li>
            </ul>
          </div>
        </div>
      </section>
    </main>
  );
};

// This export lets the router show Dashboard at /.
export default Dashboard;
