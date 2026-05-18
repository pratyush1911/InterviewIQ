import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../../lib/api";
import { useAuth } from "../../auth/hooks/useAuth";
import "./interview.scss";

// Learning note: these inline SVG components draw the sidebar icons.
// They are normal React components that return SVG markup.

// ─── Icons ───────────────────────────────────────────────────────────────────

const IconTechnical = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16 18 22 12 16 6" />
    <polyline points="8 6 2 12 8 18" />
  </svg>
);

const IconBehavioral = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const IconRoadmap = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
    <line x1="8" y1="2" x2="8" y2="18" />
    <line x1="16" y1="6" x2="16" y2="22" />
  </svg>
);

const IconChevronRight = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

// This component renders one AI-generated interview preparation report.
const Interview = () => {
  // This block reads the report ID from the URL and prepares navigation.
  const { interviewId } = useParams();
  const navigate = useNavigate();
  const { handleLogout } = useAuth();
  // These state blocks control the active report tab and loading/error states.
  const [activeTab, setActiveTab] = useState("technical");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [signingOut, setSigningOut] = useState(false);

  // This effect loads the report from the backend whenever the URL ID changes.
  useEffect(() => {
    // This inner function keeps the async API call organized.
    const fetchReport = async () => {
      try {
        setLoading(true);
        // This API call fetches the report owned by the logged-in user.
        const response = await api.get(`/api/interview/${interviewId}`);
        setData(response.data.interviewReport);
      } catch (err) {
        console.error("Failed to fetch report:", err);
        setError("Report not found or failed to load.");
      } finally {
        setLoading(false);
      }
    };

    // This block only fetches when the route actually has an interviewId.
    if (interviewId) {
      fetchReport();
    }
  }, [interviewId]);

  // This block logs the user out from the report page.
  const handleSignOut = async () => {
    if (signingOut) {
      return;
    }

    setSigningOut(true);
    const result = await handleLogout();
    setSigningOut(false);

    if (result.success) {
      navigate("/login");
    } else {
      setError(result.message);
    }
  };

  // This block renders a loading screen while the report is being fetched.
  if (loading) {
    return (
      <main className="interview-page">
        <div className="ambient ambient--primary" />
        <div className="ambient ambient--secondary" />
        <div className="noise-overlay" />
        <div className="interview-container" style={{ justifyContent: "center", alignItems: "center" }}>
          <p style={{ color: "#fff", fontSize: "1.2rem" }}>Loading your preparation report...</p>
        </div>
      </main>
    );
  }

  // This block renders an error screen if the report cannot be loaded.
  if (error || !data) {
    return (
      <main className="interview-page">
        <div className="ambient ambient--primary" />
        <div className="ambient ambient--secondary" />
        <div className="noise-overlay" />
        <div className="interview-container" style={{ justifyContent: "center", alignItems: "center", flexDirection: "column", gap: "1rem" }}>
          <p style={{ color: "#ff4d4d", fontSize: "1.2rem" }}>{error || "Report not found."}</p>
          <button onClick={() => navigate("/")} className="cta-btn" style={{ width: "auto" }}>Go Back Home</button>
        </div>
      </main>
    );
  }

  // This function chooses which report tab content to display.
  const renderContent = () => {
    switch (activeTab) {
      case "technical":
        // This tab shows technical interview questions and suggested answers.
        return (
          <div className="interview-content__list">
            <h2 className="content-title">Technical Deep Dive</h2>
            {data.technicalQuestions?.map((q, i) => (
              <div key={i} className="question-card">
                <span className="question-index">Question {i + 1}</span>
                <p className="question-text">{q.question}</p>
                <div className="answer-box">
                  <span className="answer-label">Suggested Answer</span>
                  <p className="answer-text">{q.answer}</p>
                  {q.intention && <p className="intention-text" style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.4)", marginTop: "0.5rem" }}>Intention: {q.intention}</p>}
                </div>
              </div>
            ))}
          </div>
        );
      case "behavioral":
        // This tab shows behavioral questions and suggested responses.
        return (
          <div className="interview-content__list">
            <h2 className="content-title">Behavioral & Culture</h2>
            {data.behavioralQuestions?.map((q, i) => (
              <div key={i} className="question-card">
                <span className="question-index">Situation {i + 1}</span>
                <p className="question-text">{q.question}</p>
                <div className="answer-box">
                  <span className="answer-label">Suggested Response</span>
                  <p className="answer-text">{q.answer}</p>
                  {q.intention && <p className="intention-text" style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.4)", marginTop: "0.5rem" }}>Intention: {q.intention}</p>}
                </div>
              </div>
            ))}
          </div>
        );
      case "roadmap":
        // This tab shows a day-by-day preparation plan.
        return (
          <div className="interview-content__list">
            <h2 className="content-title">Preparation Roadmap</h2>
            <div className="roadmap-container">
              {data.preparationPlan?.map((p, i) => (
                <div key={i} className="roadmap-item roadmap-item--pending">
                  <div className="roadmap-dot" />
                  <div className="roadmap-details">
                    <p className="roadmap-step">Day {p.day}: {p.focus}</p>
                    <ul className="roadmap-tasks" style={{ listStyle: "disc", marginLeft: "1.5rem", marginTop: "0.5rem", color: "rgba(255,255,255,0.6)" }}>
                      {p.tasks?.map((task, j) => (
                        <li key={j}>{task}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      default:
        // This fallback protects the UI if activeTab ever has an unknown value.
        return null;
    }
  };

  // This return block draws the full report layout: nav, content, and skill gaps.
  return (
    <main className="interview-page">
      <div className="ambient ambient--primary" />
      <div className="ambient ambient--secondary" />
      <div className="noise-overlay" />

      <div className="interview-container">
        {/* This sidebar lets the user switch between report sections. */}
        <aside className="interview-sidebar">
          <nav className="interview-nav">
            <button
              className={`nav-item ${activeTab === "technical" ? "nav-item--active" : ""}`}
              onClick={() => setActiveTab("technical")}
            >
              <IconTechnical />
              <span>Technical Questions</span>
              <IconChevronRight />
            </button>
            <button
              className={`nav-item ${activeTab === "behavioral" ? "nav-item--active" : ""}`}
              onClick={() => setActiveTab("behavioral")}
            >
              <IconBehavioral />
              <span>Behavioral Questions</span>
              <IconChevronRight />
            </button>
            <button
              className={`nav-item ${activeTab === "roadmap" ? "nav-item--active" : ""}`}
              onClick={() => setActiveTab("roadmap")}
            >
              <IconRoadmap />
              <span>Preparation Plan</span>
              <IconChevronRight />
            </button>
          </nav>

          <footer className="sidebar-footer">
            <p>Report ID: {interviewId?.slice(0, 8)}</p>
            {data.matchScore !== undefined && (
              <div className="match-score-pill" style={{ marginTop: "1rem", padding: "0.5rem", borderRadius: "8px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
                <span style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.5)" }}>Match Score:</span>
                <span style={{ fontSize: "1.1rem", fontWeight: "700", color: "#e1034d", marginLeft: "0.5rem" }}>{data.matchScore}%</span>
              </div>
            )}
            <button
              className="signout-button signout-button--sidebar"
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
          </footer>
        </aside>

        {/* This main section displays the currently selected tab. */}
        <section className="interview-main">
          <div className="content-scroll-area">
            {renderContent()}
          </div>
        </section>

        {/* This side panel highlights the skills the user should improve. */}
        <aside className="interview-gaps">
          <div className="gaps-header">
            <h3 className="gaps-title">Skill Gaps</h3>
            <p className="gaps-subtitle">Areas to focus on before the interview</p>
          </div>
          <div className="gaps-list">
            {data.skillGaps?.map((gap, i) => (
              <div key={i} className="gap-tag-wrapper" style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                <span className="gap-tag">
                  {gap.skill}
                </span>
                <span style={{ fontSize: "0.6rem", textTransform: "uppercase", color: gap.severity === "high" ? "#ff4d4d" : gap.severity === "medium" ? "#ffcc00" : "#34d399" }}>
                  {gap.severity}
                </span>
              </div>
            ))}
          </div>
          
          <div className="gaps-cta">
             <div className="cta-icon">💡</div>
             <p>Addressing these gaps systematically will greatly improve your confidence and performance.</p>
          </div>
        </aside>
      </div>
    </main>
  );
};

// This export lets the router show Interview at /interview/:interviewId.
export default Interview;
