import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../lib/api";
import { useAuth } from "../../auth/hooks/useAuth";
import "../style/home.scss";

// Learning note: the small functions below are inline SVG icon components.
// They draw visual icons used by the form without needing an extra icon package.

// ─── Inline SVG Icons (no emoji, no dependencies) ───────────────────────────

const IconBriefcase = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
  </svg>
);

const IconUpload = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);

const IconFileText = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);

const IconUser = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const IconArrowRight = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

const IconCheck = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const IconSparkle = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0L14.59 8.41L23 12L14.59 15.59L12 24L9.41 15.59L1 12L9.41 8.41L12 0Z" />
  </svg>
);

// ─── UI Layer ────────────────────────────────────────────────────────────────

// This component renders the resume/job-description form page.
const Home = () => {
  // This block gives the page navigation and logout support.
  const navigate = useNavigate();
  const { handleLogout } = useAuth();
  // These state blocks store form values and UI status for this page.
  const [jobDescription, setJobDescription] = useState("");
  const [selfDescription, setSelfDescription] = useState("");
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState(null);
  // This ref points to the hidden file input element.
  const fileInputRef = useRef(null);

  // This block runs when the user selects a PDF with the file picker.
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === "application/pdf") {
      setFile(selectedFile);
      setError(null);
    } else {
      setError("Please select a valid PDF file.");
    }
  };

  // These blocks handle drag-and-drop behavior for the resume upload area.
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = () => setIsDragging(false);
  // This block accepts dropped PDFs and rejects other file types.
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === "application/pdf") {
      setFile(droppedFile);
      setError(null);
    } else {
      setError("Please drop a valid PDF file.");
    }
  };

  // This block sends the resume and job details to the backend AI report endpoint.
  const handleGenerate = async () => {
    // This validation stops the request if required inputs are missing.
    if (!file || !jobDescription) {
      setError("Please provide both a resume and a job description.");
      return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData();
    // FormData is used because file uploads cannot be sent as plain JSON.
    formData.append("resume", file);
    formData.append("jobDescription", jobDescription);
    formData.append("selfDescription", selfDescription);

    try {
      // This API call creates the report on the backend.
      const response = await api.post("/api/interview/", formData);

      // This block opens the report page after the backend returns its ID.
      if (response.data.interviewReport) {
        navigate(`/interview/${response.data.interviewReport._id}`);
      }
    } catch (err) {
      console.error("Generation failed:", err);
      // Try to get the specific error from the backend response
      const backendError = err.response?.data?.error || err.response?.data?.msg || err.message;
      setError(`Generation failed: ${backendError}`);
    } finally {
      // This always turns off the loading state after success or failure.
      setLoading(false);
    }
  };

  // This block logs the user out from this page.
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

  // This return block draws the full resume-match form experience.
  return (
    <main className="interview-home">
      {/* Ambient gradients */}
      <div className="ambient ambient--primary" />
      <div className="ambient ambient--secondary" />
      <div className="noise-overlay" />

      <div className="interview-home__inner">
        <div className="home-topbar">
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
        </div>

        {/* This section is the page headline shown above the form. */}
        <section className="hero">
          <span className="hero__tag">
            <IconSparkle />
            Interview Prep
          </span>
          <h1 className="hero__heading">
            Prepare smarter,
            <br />
            <span className="hero__heading--gradient">not harder.</span>
          </h1>
          <p className="hero__sub">
            Paste a job description and your profile — our AI generates
            tailored interview questions in seconds.
          </p>
        </section>

        {/* This block contains both sides of the report-generation form. */}
        <div className="form-card">
          {/* ── Left: Job Description ──────────────────────── */}
          <div className="form-card__section">
            <div className="section-label">
              <IconBriefcase />
              <span>Job Description</span>
            </div>
            <textarea
              id="jobDescription"
              className="input-area"
              placeholder="Paste the full job posting here…"
              rows={12}
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
            />
          </div>

          {/* ── Center Divider ────────────────────────────── */}
          <div className="form-card__divider" aria-hidden="true">
            <span className="form-card__divider-dot" />
          </div>

          {/* ── Right: Profile ────────────────────────────── */}
          <div className="form-card__section">
            {/* This block is the PDF upload area. */}
            <div className="section-label">
              <IconFileText />
              <span>Resume</span>
              <span className="section-label__hint">PDF, max 3 MB</span>
            </div>

            <label
              htmlFor="resume"
              className={`dropzone ${isDragging ? "dropzone--active" : ""} ${file ? "dropzone--done" : ""}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                hidden
                type="file"
                id="resume"
                accept=".pdf"
                onChange={handleFileChange}
              />
              {file ? (
                <div className="dropzone__success">
                  <span className="dropzone__check"><IconCheck /></span>
                  <span className="dropzone__filename">{file.name}</span>
                </div>
              ) : (
                <div className="dropzone__idle">
                  <IconUpload />
                  <span>
                    Drop file or <span className="dropzone__browse">browse</span>
                  </span>
                </div>
              )}
            </label>

            {/* This block lets the user add extra information beyond the resume. */}
            <div className="section-label section-label--mt">
              <IconUser />
              <span>About You</span>
              <span className="section-label__hint">
                Combine with resume for best results
              </span>
            </div>
            <textarea
              id="selfDescription"
              className="input-area input-area--short"
              placeholder="Summarise your experience, skills, and what you're looking for…"
              rows={5}
              value={selfDescription}
              onChange={(e) => setSelfDescription(e.target.value)}
            />

            {/* This block only appears when validation or generation fails. */}
            {error && (
              <p style={{ color: "#ff4d4d", fontSize: "0.85rem", marginTop: "0.5rem", fontWeight: "500" }}>
                {error}
              </p>
            )}

            {/* This button starts the AI report generation request. */}
            <button 
              className="cta-btn" 
              type="button" 
              onClick={handleGenerate}
              disabled={loading}
              style={{ opacity: loading ? 0.7 : 1, cursor: loading ? "not-allowed" : "pointer" }}
            >
              <span>{loading ? "Generating..." : "Generate Questions"}</span>
              {!loading && <IconArrowRight />}
            </button>
          </div>
        </div>

        <p className="footer-note">
          Your data is processed in-session and never stored.
        </p>
      </div>
    </main>
  );
};

// This export lets the router show Home at /prepare.
export default Home;
