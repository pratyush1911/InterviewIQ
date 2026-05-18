require("dotenv").config();
const app = require("./src/app");
const connectToDB = require("./src/config/database");

// This block chooses the port where the backend API will listen.
// The website frontend sends login, resume, and interview requests to this server.
const PORT = process.env.PORT || 3000;

// This block starts the backend in the correct order: first connect to MongoDB,
// then open the Express server so the website can safely call the API routes.
async function startServer() {
  try {
    await connectToDB();
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err.message);
    process.exit(1);
  }
}

// This line runs the startup function above when you type `npm run dev`.
startServer();
