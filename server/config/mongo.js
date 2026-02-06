const mongoose = require("mongoose");

let isConnected = false;

const connectMongo = async () => {
    if (isConnected) {
        return;
    }

    try {
        const uri = process.env.MONGO_URI || process.env.MONGO_URL;
        if (!uri) {
            throw new Error("No MongoDB URI found in environment variables (MONGO_URI or MONGO_URL)");
        }
        await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });
        isConnected = true;
        console.log("MongoDB connected");
    } catch (error) {
        console.error("MongoDB connection error:", error);
        throw error;
    }
};

module.exports = connectMongo;
