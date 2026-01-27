const evaluationService = require("../services/evaluation.service");

/**
 * Handles the request to save a draft evaluation.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 */
async function saveDraft(req, res) {
    try {
        const data = req.body;
        await evaluationService.saveDraft(data);
        res.json({ message: "Draft saved successfully" });
    } catch (err) {
        console.error("Save Draft Error:", err);
        res.status(500).json({ error: "Failed to save draft" });
    }
}

/**
 * Handles the request to submit a final evaluation.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 */
async function submitEvaluation(req, res) {
    try {
        const data = req.body;
        await evaluationService.submitEvaluation(data);
        res.json({ message: "Evaluation submitted successfully" });
    } catch (err) {
        console.error("Submit Evaluation Error:", err);
        // Determine status code based on error type if possible, default to 400 for submission errors
        res.status(400).json({ error: err.message });
    }
}

module.exports = {
    saveDraft,
    submitEvaluation
};
