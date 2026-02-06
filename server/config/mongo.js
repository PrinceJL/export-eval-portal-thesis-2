const mongoose = require("mongoose");

const connectMongo = async () => {
    // 0: disconnected, 1: connected, 2: connecting, 3: disconnecting
    if (mongoose.connection.readyState === 1) {
        return;
    }

    try {
        const uri = process.env.MONGO_URI || process.env.MONGO_URL;
        if (!uri) {
            throw new Error("No MongoDB URI found in environment variables (MONGO_URI or MONGO_URL)");
        }

        // Disable buffering globally for serverless to prevent hangs on stalled connections
        mongoose.set("bufferCommands", false);

        await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 30000,
            heartbeatFrequencyMS: 10000,
        });

        console.log("MongoDB connected successfully");
    } catch (error) {
        console.error("MongoDB connection error:", error);
        throw error;
    }
};

module.exports = connectMongo;
