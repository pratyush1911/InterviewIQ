const mongoose = require("mongoose");

// This function connects the backend to MongoDB.
// Without this connection, users, reports, and logout tokens cannot be saved.
async function connectToDB() {
  // This block gives a clear error if the database URL is missing from .env.
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is not configured");
  }

  // This block opens the database connection.
  // The timeout prevents the website from waiting forever if MongoDB is unavailable.
  await mongoose.connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 10000,
  });
  console.log("Connected to Database");
}

// This export allows server.js to call connectToDB before starting the API.
module.exports = connectToDB;
