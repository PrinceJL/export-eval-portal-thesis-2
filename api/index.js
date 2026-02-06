const mongoose = require("mongoose");
mongoose.set("bufferCommands", false); // Disable buffering before requiring models
require("pg"); // Explicitly require to force Vercel bundler to include it
require("dotenv").config();
const app = require("../server/app");
const connectMongo = require("../server/config/mongo");
const { sql } = require("../server/models/index");

// For local development only
if (process.env.NODE_ENV === "development") {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Server running locally on port ${PORT}`);
    });
}

// Export the app for Vercel
module.exports = app;
