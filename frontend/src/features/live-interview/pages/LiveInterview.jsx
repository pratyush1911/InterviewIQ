import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../lib/api";
import { useAuth } from "../../auth/hooks/useAuth";
import "./live-interview.scss";

// This list is the script of questions used by the live interview practice page.
const QUESTIONS = [
  "Tell me about yourself and the role you are targeting.",
  "Walk me through one project where you solved a difficult technical problem.",
  "How do you handle a deadline when requirements change late in the process?",
  "Explain a skill gap you are actively improving and how you are working on it.",
  "Why should this team select you over another qualified candidate?",
];

// This helper returns the browser's speech recognition API when it exists.
// Chrome exposes it as webkitSpeechRecognition, so the fallback matters.
const getSpeechRecognition = () =>
  window.SpeechRecognition || window.webkitSpeechRecognition;

// This component renders the live voice-style interview practice page.
const LiveInterview = () => {
  // This block gives the page navigation and logout support.
  const navigate = useNavigate();
  const { handleLogout } = useAuth();
  // This ref stores the active microphone recognition object between renders.
  const recognitionRef = useRef(null);
  // These state blocks track the role, current question, answer text, and AI results.
  const [role, setRole] = useState("Frontend Engineer");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [answers, setAnswers] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [decision, setDecision] = useState(null);
  const [error, setError] = useState("");
  const [speechUnavailable, setSpeechUnavailable] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  // These derived values are recalculated from state on each render.
  const question = QUESTIONS[questionIndex];
  const speechSupported =
    typeof window !== "undefined" && Boolean(getSpeechRecognition());
  const canUseSpeechRecognition = speechSupported && !speechUnavailable;

  // This cleanup effect stops microphone and speech playback when leaving the page.
  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
      window.speechSynthesis?.cancel();
    };
  }, []);

  // This block reads the current question aloud using the browser voice API.
  const speakQuestion = () => {
    if (!window.speechSynthesis) {
      setError("Voice playback is not supported in this browser.");
      return;
    }

    stopListening();
    window.speechSynthesis.cancel();
    // SpeechSynthesisUtterance is the browser object that turns text into speech.
    const utterance = new SpeechSynthesisUtterance(question);
    utterance.rate = 0.92;
    utterance.pitch = 0.95;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  // This block starts microphone transcription for the user's answer.
  const startListening = async () => {
    const SpeechRecognition = getSpeechRecognition();
    if (!SpeechRecognition || speechUnavailable) {
      setSpeechUnavailable(true);
      setError(
        "Voice transcription is not available in this browser. Type your answer below.",
      );
      return;
    }

    setError("");
    window.speechSynthesis?.cancel();

    try {
      if (navigator.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        stream.getTracks().forEach((track) => track.stop());
      }
    } catch (err) {
      setError(
        "Microphone permission is blocked. Allow microphone access in the browser, then try again.",
      );
      setIsListening(false);
      return;
    }

    recognitionRef.current?.stop();
    // This object listens to the microphone and produces transcript text.
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.maxAlternatives = 1;
    recognition.onresult = (event) => {
      // This block combines all speech recognition results into one transcript.
      let text = "";
      for (let i = 0; i < event.results.length; i += 1) {
        text += event.results[i][0].transcript;
      }
      setTranscript(text.trim());
    };
    recognition.onerror = (event) => {
      if (event.error === "no-speech" || event.error === "aborted") {
        setIsListening(false);
        return;
      }

      if (
        event.error === "not-allowed" ||
        event.error === "service-not-allowed"
      ) {
        setError(
          "Microphone permission is blocked. Allow microphone access in the browser, then try again.",
        );
      } else if (event.error === "audio-capture") {
        setError(
          "No microphone was found. Connect a microphone or type your answer.",
        );
      } else if (event.error === "network") {
        setSpeechUnavailable(true);
        setError(
          "Voice transcription is blocked or unavailable in this browser. Type your answer below, or use Chrome for microphone transcription.",
        );
      } else {
        setError(
          "Microphone transcription stopped. Retry or type your answer.",
        );
      }
      setIsListening(false);
    };
    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;

    try {
      recognition.start();
      setIsListening(true);
    } catch (err) {
      setError("Microphone is already starting. Wait a second and try again.");
      setIsListening(false);
    }
  };

  // This block stops microphone capture.
  const stopListening = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
  };

  // This block submits the current answer to the backend for AI scoring.
  const submitAnswer = async () => {
    // This validation prevents empty answers from being judged.
    if (!transcript.trim()) {
      setError("Record or type an answer before submitting.");
      return;
    }

    setError("");
    setEvaluating(true);
    stopListening();

    try {
      // This API call evaluates one answer and returns score/feedback.
      const response = await api.post("/api/live-interview/evaluate", {
        role,
        question,
        answer: transcript.trim(),
        questionNumber: questionIndex + 1,
      });

      const answerRecord = {
        question,
        answer: transcript.trim(),
        ...response.data.evaluation,
      };
      // This block stores the answer locally so the final decision can use all answers.
      const nextAnswers = [...answers, answerRecord];
      setAnswers(nextAnswers);
      setTranscript("");

      if (questionIndex < QUESTIONS.length - 1) {
        // This block advances to the next question until the list is complete.
        setQuestionIndex((current) => current + 1);
      } else {
        // This block asks the backend for the final mock hiring decision.
        setFinalizing(true);
        const finalResponse = await api.post("/api/live-interview/finalize", {
          role,
          answers: nextAnswers,
        });
        setDecision(finalResponse.data.decision);
        setFinalizing(false);
      }
    } catch (err) {
      // This block shows backend or browser errors to the user.
      setError(
        err.response?.data?.error || err.response?.data?.msg || err.message,
      );
    } finally {
      setEvaluating(false);
      setFinalizing(false);
    }
  };

  // This block resets the whole interview so the user can practice again.
  const restartInterview = () => {
    stopListening();
    window.speechSynthesis?.cancel();
    setQuestionIndex(0);
    setTranscript("");
    setAnswers([]);
    setDecision(null);
    setError("");
    setSpeechUnavailable(false);
  };

  // This block logs the user out from the live interview page.
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

  // This return block draws the live interview interface.
  return (
    <main className="live-page">
      <div className="ambient ambient--primary" />
      <div className="ambient ambient--secondary" />
      <div className="noise-overlay" />

      <section className="live-shell">
        <header className="live-header">
          <button
            className="ghost-nav"
            type="button"
            onClick={() => navigate("/")}
          >
            Back to dashboard
          </button>
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

        {/* This hero block explains what the live interview page does. */}
        <div className="live-hero">
          <p className="live-eyebrow">AI Voice Interview</p>
          <h1>Practice under pressure, then get a decision.</h1>
          <p>
            The assistant asks each question aloud, listens through your
            microphone, scores your response, and finishes with a mock selection
            verdict.
          </p>
        </div>

        {/* This layout contains the interviewer panel and the answer panel. */}
        <div className="live-layout">
          {/* This panel shows the current question and microphone controls. */}
          <section className="interviewer-card">
            <div className="interviewer-orb" aria-hidden="true">
              <span />
            </div>
            <div className="question-meta">
              <span>
                Question {Math.min(questionIndex + 1, QUESTIONS.length)} of{" "}
                {QUESTIONS.length}
              </span>
              <input
                value={role}
                onChange={(event) => setRole(event.target.value)}
                aria-label="Target role"
              />
            </div>

            <h2>{decision ? "Interview complete" : question}</h2>

            {!decision && (
              <div className="live-actions">
                <button
                  className="live-button live-button--secondary"
                  type="button"
                  onClick={speakQuestion}
                  disabled={isSpeaking}
                >
                  {isSpeaking ? "Speaking..." : "Ask question aloud"}
                </button>
                <button
                  className={`live-button ${isListening ? "live-button--danger" : ""}`}
                  type="button"
                  onClick={isListening ? stopListening : startListening}
                  disabled={!canUseSpeechRecognition}
                >
                  {isListening
                    ? "Stop microphone"
                    : canUseSpeechRecognition
                      ? "Start microphone"
                      : "Type answer"}
                </button>
              </div>
            )}
          </section>

          {/* This panel either collects the current answer or shows the final decision. */}
          <section className="answer-card">
            {decision ? (
              <div className="decision-panel">
                <span
                  className={`decision-badge ${decision.selected ? "is-selected" : ""}`}
                >
                  {decision.selected ? "Selected" : "Not selected yet"}
                </span>
                <h2>{decision.decision}</h2>
                <p>{decision.summary}</p>
                <div className="score-ring">
                  <strong>{Math.round(decision.confidenceScore)}</strong>
                  <span>confidence</span>
                </div>
                <div className="decision-columns">
                  <div>
                    <h3>Hiring signals</h3>
                    {decision.hiringSignals?.map((item) => (
                      <p key={item}>{item}</p>
                    ))}
                  </div>
                  <div>
                    <h3>Next steps</h3>
                    {decision.nextSteps?.map((item) => (
                      <p key={item}>{item}</p>
                    ))}
                  </div>
                </div>
                <button
                  className="live-button"
                  type="button"
                  onClick={restartInterview}
                >
                  Practice again
                </button>
              </div>
            ) : (
              <>
                <label htmlFor="answer">Your answer transcript</label>
                <textarea
                  id="answer"
                  value={transcript}
                  onChange={(event) => setTranscript(event.target.value)}
                  placeholder={
                    canUseSpeechRecognition
                      ? "Start the microphone and your answer will appear here..."
                      : "Type your answer here..."
                  }
                />
                {error && <p className="live-error">{error}</p>}
                <button
                  className="live-button live-button--wide"
                  type="button"
                  onClick={submitAnswer}
                  disabled={evaluating || finalizing}
                  aria-busy={evaluating || finalizing}
                >
                  {evaluating || finalizing ? (
                    <>
                      <span className="button-spinner" aria-hidden="true" />
                      <span>
                        {finalizing
                          ? "Making decision..."
                          : "Judging answer..."}
                      </span>
                    </>
                  ) : (
                    "Submit answer"
                  )}
                </button>
              </>
            )}
          </section>
        </div>

        {/* This feedback strip appears after at least one answer has been scored. */}
        {answers.length > 0 && (
          <section className="feedback-strip">
            {answers.map((item, index) => (
              <article
                key={`${item.question}-${index}`}
                className="feedback-card"
              >
                <span>Q{index + 1}</span>
                <strong>{item.score}/10</strong>
                <p>{item.feedback}</p>
              </article>
            ))}
          </section>
        )}
      </section>
    </main>
  );
};

// This export lets the router show LiveInterview at /live-interview.
export default LiveInterview;
