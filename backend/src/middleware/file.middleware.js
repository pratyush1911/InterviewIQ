const multer = require("multer");

// This block configures Multer, the library that reads uploaded files.
// The website uploads a resume PDF, and this keeps that PDF in memory for parsing.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 3 * 1024 * 1024, // 3mb
  },
});

// This export lets the interview route accept one file named "resume".
module.exports = upload;
