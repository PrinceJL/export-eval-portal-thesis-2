const express = require("express");
const cors = require("cors");

const expertRoutes = require("./routes/expert.routes");
const authRoutes = require("./routes/auth.routes");
const adminRoutes = require("./routes/admin.routes");
const systemRoutes = require("./routes/system.routes");
const messageRoutes = require("./routes/message.routes");

const app = express();

// --- Database Connection Logic (Serverless optimized) ---
const connectMongo = require("./config/mongo");
const { sql } = require("./models/index");
const mongoose = require("mongoose");

let dbPromise = null;
const initDBs = async () => {
    if (dbPromise) return dbPromise;
    dbPromise = (async () => {
        try {
            await connectMongo();
            await sql.sequelize.authenticate();
            if (process.env.NODE_ENV === "development") {
                await sql.sequelize.sync({ alter: true });
                console.log("Database schema synced for development");
            }
            console.log("Database connections initialized successfully");
        } catch (error) {
            console.error("Database initialization failed:", error);
            dbPromise = null;
            throw error;
        }
    })();
    return dbPromise;
};

app.use(async (req, res, next) => {
    try {
        await initDBs();
        // Resilience check for serverless pause/resume
        if (mongoose.connection.readyState !== 1) {
            dbPromise = null;
            await initDBs();
        }
        next();
    } catch (error) {
        res.status(500).json({ error: "Database connection failed", details: error.message });
    }
});
// ----------------------------------------------------

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));


// Routes
app.use("/api/system", systemRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/expert", expertRoutes);
app.use("/api/admin", adminRoutes);

module.exports = app;
