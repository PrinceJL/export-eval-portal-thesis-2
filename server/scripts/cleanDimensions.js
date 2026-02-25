require('dotenv').config({ path: __dirname + '/../../.env' });
const mongoose = require('mongoose');
const EvaluationScoring = require('../models/evalV2/evaluation_scoring.model');

async function cleanDimensions() {
    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("MongoDB connected.");

        console.log("Cleaning EvaluationScoring collection...");
        await EvaluationScoring.deleteMany({});
        console.log("EvaluationScoring collection cleaned.");

        console.log("Process completed.");
        process.exit(0);
    } catch (error) {
        console.error("Error cleaning dimensions:", error);
        process.exit(1);
    }
}

cleanDimensions();
