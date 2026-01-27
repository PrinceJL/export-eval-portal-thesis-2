const mongoose = require("mongoose");

const EvaluationSchema = new mongoose.Schema({
    assignmentId: String,
    expertId: String,
    modelVersionId: String,
    scores: {
        legalCorrectness: Number,
        jurisdictionalPrecision: Number,
        linguisticAccessibility: Number,
        temporalValidity: Number
    },
    distressDetection: { type: String, enum: ["PASS", "FAIL"] },
    notes: String,
    submitted: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model("EvaluationResponse", EvaluationSchema);

const REQUIRED_FIELDS = [
    "legalCorrectness",
    "jurisdictionalPrecision",
    "linguisticAccessibility",
    "temporalValidity"
];

function validateEvaluation(scores) {
    for (const field of REQUIRED_FIELDS) {
        if (!(field in scores)) {
            throw new Error(`Missing score: ${field}`);
        }
        if (scores[field] < 1 || scores[field] > 5) {
            throw new Error(`Invalid Likert score for ${field}`);
        }
    }
}

module.exports = { validateEvaluation };
