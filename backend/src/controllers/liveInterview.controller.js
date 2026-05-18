const {
  evaluateLiveInterviewAnswer,
  finalizeLiveInterview,
} = require("../services/ai.service");

// This controller scores one live interview answer.
async function evaluateAnswerController(req, res) {
  try {
    // This block reads the question and answer sent by the React live interview page.
    const { role, question, answer, questionNumber } = req.body;

    // This block prevents empty evaluations.
    if (!question || !answer) {
      return res.status(400).json({
        msg: "Question and answer are required",
      });
    }

    // This block asks the AI service to score the answer and give feedback.
    const evaluation = await evaluateLiveInterviewAnswer({
      role,
      question,
      answer,
      questionNumber,
    });

    res.status(200).json({
      msg: "Answer evaluated successfully",
      evaluation,
    });
  } catch (err) {
    // This block returns a clear error if AI scoring fails.
    res.status(500).json({
      msg: "Unable to evaluate answer",
      error: err.message,
    });
  }
}

// This controller creates the final mock hiring decision after all answers.
async function finalizeInterviewController(req, res) {
  try {
    // This block reads the target role and all saved answers from the frontend.
    const { role, answers } = req.body;

    // This block makes sure there is at least one answer to judge.
    if (!Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({
        msg: "At least one answer is required",
      });
    }

    // This block asks the AI service to summarize performance and make a decision.
    const decision = await finalizeLiveInterview({
      role,
      answers,
    });

    res.status(200).json({
      msg: "Interview decision generated successfully",
      decision,
    });
  } catch (err) {
    // This block returns a clear error if final AI judging fails.
    res.status(500).json({
      msg: "Unable to finalize interview",
      error: err.message,
    });
  }
}

// This export lets liveInterview.routes.js connect URLs to these functions.
module.exports = {
  evaluateAnswerController,
  finalizeInterviewController,
};
