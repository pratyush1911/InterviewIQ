const { GoogleGenerativeAI } = require("@google/generative-ai");

// This block creates the Google Gemini client used by all AI features.
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENAI_API_KEY);

// This block chooses the main AI model and backup models.
// Backups help the website keep working if the first model name is unavailable.
const MODEL_NAME = process.env.GOOGLE_GENAI_MODEL || "models/gemini-2.5-flash";
const MODEL_FALLBACKS = [
  MODEL_NAME,
  "models/gemini-2.0-flash",
  "models/gemini-flash-latest",
].filter((modelName, index, models) => models.indexOf(modelName) === index);

// This schema tells Gemini exactly what shape the resume-match report must return.
// A strict shape makes the frontend easier to render because fields are predictable.
const interviewReportSchema = {
  type: "object",
  properties: {
    matchScore: { type: "number" },
    technicalQuestions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          question: { type: "string" },
          intention: { type: "string" },
          answer: { type: "string" },
        },
        required: ["question", "intention", "answer"],
      },
    },
    behavioralQuestions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          question: { type: "string" },
          intention: { type: "string" },
          answer: { type: "string" },
        },
        required: ["question", "intention", "answer"],
      },
    },
    skillGaps: {
      type: "array",
      items: {
        type: "object",
        properties: {
          skill: { type: "string" },
          severity: { type: "string", enum: ["low", "medium", "high"] },
        },
        required: ["skill", "severity"],
      },
    },
    preparationPlan: {
      type: "array",
      items: {
        type: "object",
        properties: {
          day: { type: "number" },
          focus: { type: "string" },
          tasks: { type: "array", items: { type: "string" } },
        },
        required: ["day", "focus", "tasks"],
      },
    },
  },
  required: [
    "matchScore",
    "technicalQuestions",
    "behavioralQuestions",
    "skillGaps",
    "preparationPlan",
  ],
};

// This schema tells Gemini what one live answer evaluation should contain.
const liveAnswerSchema = {
  type: "object",
  properties: {
    score: { type: "number" },
    verdict: { type: "string", enum: ["strong", "borderline", "weak"] },
    feedback: { type: "string" },
    strengths: {
      type: "array",
      items: { type: "string" },
    },
    improvements: {
      type: "array",
      items: { type: "string" },
    },
    sampleBetterAnswer: { type: "string" },
  },
  required: [
    "score",
    "verdict",
    "feedback",
    "strengths",
    "improvements",
    "sampleBetterAnswer",
  ],
};

// This schema tells Gemini what the final mock hiring decision should contain.
const liveDecisionSchema = {
  type: "object",
  properties: {
    selected: { type: "boolean" },
    confidenceScore: { type: "number" },
    decision: { type: "string" },
    summary: { type: "string" },
    hiringSignals: {
      type: "array",
      items: { type: "string" },
    },
    riskSignals: {
      type: "array",
      items: { type: "string" },
    },
    nextSteps: {
      type: "array",
      items: { type: "string" },
    },
  },
  required: [
    "selected",
    "confidenceScore",
    "decision",
    "summary",
    "hiringSignals",
    "riskSignals",
    "nextSteps",
  ],
};

// This helper cleans AI text and converts it into a real JavaScript object.
function parseJsonResponse(text) {
  let cleaned = text;

  // This block removes Markdown code fences if the model wraps JSON in them.
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.replace(/```json\n?/, "").replace(/\n?```/, "");
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/```\n?/, "").replace(/\n?```/, "");
  }

  return JSON.parse(cleaned.trim());
}

// This helper sends a prompt to Gemini and requires the response to match a schema.
async function generateStructuredContent({ prompt, responseSchema }) {
  let lastError;

  // This block tries each model until one succeeds.
  for (const modelName of MODEL_FALLBACKS) {
    try {
      // This block configures Gemini to answer as JSON instead of normal prose.
      const model = genAI.getGenerativeModel(
        {
          model: modelName,
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema,
          },
        },
        { apiVersion: "v1beta" },
      );

      // This block runs the model, reads its text, and parses it into an object.
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return parseJsonResponse(response.text());
    } catch (err) {
      // This block remembers the failure and tries the next fallback model.
      lastError = err;
      console.warn(`${modelName} failed: ${err.message}`);
    }
  }

  // If every model failed, this line throws the last error to the controller.
  throw lastError;
}

// This function powers the resume/job-description report feature.
async function generateInterviewReport({
  resume,
  selfDescription,
  jobDescription,
}) {
  // This prompt tells the AI what role to play and includes the user's inputs.
  const prompt = `You are an expert career coach and interview preparation assistant. 
Analyze the candidate's profile against the job description and generate a structured interview preparation report.

Candidate Details:
Resume: ${resume}
Self Description: ${selfDescription}
Job Description: ${jobDescription}`;

  try {
    // This block asks for a report that matches interviewReportSchema.
    return await generateStructuredContent({
      prompt,
      responseSchema: interviewReportSchema,
    });
  } catch (err) {
    // This block turns AI errors into a clear server error message.
    console.error("AI generation failed:", err);
    throw new Error(`AI generation failed: ${err.message}`);
  }
}

// This function powers the per-answer scoring in the live interview page.
async function evaluateLiveInterviewAnswer({
  role,
  question,
  answer,
  questionNumber,
}) {
  // This prompt gives the AI the interview role, question, and candidate answer.
  const prompt = `You are a senior interviewer for a ${role || "software"} role.
Evaluate this spoken interview answer with fair but rigorous hiring standards.
Question ${questionNumber || ""}: ${question}
Candidate answer transcript: ${answer}

Score from 0 to 10. Give concise, actionable feedback. Do not be overly generous.`;

  try {
    // This block asks for a score and feedback that match liveAnswerSchema.
    return await generateStructuredContent({
      prompt,
      responseSchema: liveAnswerSchema,
    });
  } catch (err) {
    // This block reports evaluation failures back to the controller.
    console.error("Live answer evaluation failed:", err);
    throw new Error(`Live answer evaluation failed: ${err.message}`);
  }
}

// This function powers the final selected/not-selected result.
async function finalizeLiveInterview({ role, answers }) {
  // This block converts all saved answers into readable text for the AI prompt.
  const answerSummary = answers
    .map(
      (item, index) =>
        `Question ${index + 1}: ${item.question}\nAnswer: ${item.answer}\nScore: ${item.score ?? "not scored"}/10\nFeedback: ${item.feedback || ""}`,
    )
    .join("\n\n");

  // This prompt asks the AI to make a final mock hiring recommendation.
  const prompt = `You are making a mock hiring recommendation for a ${role || "software"} interview practice session.
Use only the transcript and scoring below.

${answerSummary}

Return whether the candidate would be selected in this mock interview, a confidence score from 0 to 100, and practical next steps.`;

  try {
    // This block asks for a decision that matches liveDecisionSchema.
    return await generateStructuredContent({
      prompt,
      responseSchema: liveDecisionSchema,
    });
  } catch (err) {
    // This block reports final-decision failures back to the controller.
    console.error("Live interview final decision failed:", err);
    throw new Error(`Live interview final decision failed: ${err.message}`);
  }
}

// These exports make the three AI functions available to controller files.
module.exports = generateInterviewReport;
module.exports.evaluateLiveInterviewAnswer = evaluateLiveInterviewAnswer;
module.exports.finalizeLiveInterview = finalizeLiveInterview;
