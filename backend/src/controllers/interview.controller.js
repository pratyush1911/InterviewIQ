const pdfParse = require("pdf-parse");
const generateInterviewReport = require("../services/ai.service");
const interviewReportModel = require("../models/interviewReport.model");

// This controller handles the "Generate Questions" button on the website.
async function generateInterviewReportController(req, res) {
  try {
    // This block reads text fields and the uploaded resume file from the request.
    const { selfDescription, jobDescription } = req.body;
    const resumeFile = req.file;

    // This block makes sure the user uploaded a resume PDF.
    if (!resumeFile) {
      return res.status(400).json({ msg: "Resume file is required" });
    }

    // This block makes sure the user pasted a job description.
    if (!jobDescription) {
      return res.status(400).json({ msg: "Job description is required" });
    }

    // This specific version of pdf-parse uses a class-based API and returns an object
    // This block converts the uploaded PDF file into plain text for the AI prompt.
    console.log("Parsing PDF buffer of size:", resumeFile.buffer.length);
    const parser = new pdfParse.PDFParse(new Uint8Array(resumeFile.buffer));
    const result = await parser.getText();
    const resumeText = result.text || ""; 
    console.log("PDF parsed. Text length:", resumeText.length);

    // This block sends the resume, profile, and job description to the AI service.
    console.log("Generating AI report...");
    const interviewReportByAi = await generateInterviewReport({
      resume: resumeText,
      selfDescription: selfDescription || "",
      jobDescription,
    });
    console.log("AI report generated successfully");

    // This block saves the AI result in MongoDB so the report page can load it later.
    const interviewReport = await interviewReportModel.create({
      user: req.user.id,
      resume: resumeText,
      selfDescription: selfDescription || "",
      jobDescription,
      ...interviewReportByAi,
    });

    res.status(201).json({
      msg: "Interview report generated successfully",
      interviewReport,
    });
  } catch (err) {
    // This block returns a useful error message if PDF parsing or AI generation fails.
    console.error("Controller Error:", err);
    res.status(500).json({
      msg: "Internal server error occurred while generating report",
      error: err.message,
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
  }
}

// This controller loads one report when the user opens /interview/:interviewId.
async function getInterviewReportByIdController(req, res) {
  try {
    // This block reads the report ID from the URL.
    const { interviewId } = req.params;
    // This block fetches only reports owned by the logged-in user.
    const interviewReport = await interviewReportModel.findOne({
      _id: interviewId,
      user: req.user.id,
    });
    // This block handles missing or unauthorized reports.
    if (!interviewReport) {
      return res.status(404).json({
        msg: "Interview report not found",
      });
    }
    res.status(200).json({
      msg: "Interview report fetched successfully",
      interviewReport,
    });
  } catch (err) {
    // This block catches invalid IDs or database errors.
    res.status(500).json({ msg: "Internal server error", error: err.message });
  }
}

// This controller loads a lightweight list of reports for the current user.
async function getInterviewReportsController(req, res) {
  try {
    // This block sorts newest reports first and removes large fields from the list view.
    const interviewReports = await interviewReportModel
      .find({
        user: req.user.id,
      })
      .sort({ createdAt: -1 })
      .select(
        "-resume -selfDescription -jobDescription -__v -technicalQuestions -behavioralQuestions -skillGaps -preparationPlan",
      );

    res.status(200).json({
      msg: "Interview reports fetched successfully",
      interviewReports,
    });
  } catch (err) {
    // This block catches database errors while listing reports.
    res.status(500).json({ msg: "Internal server error", error: err.message });
  }
}

// This export connects the route file to the three controller functions above.
module.exports = { generateInterviewReportController, getInterviewReportByIdController, getInterviewReportsController };
