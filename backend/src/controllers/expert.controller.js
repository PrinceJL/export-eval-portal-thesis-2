const evaluationService = require("../services/evaluation.service");
const evaluation = require("../models/evalV2/eval_test.service");
const assign = require("../models/evalV2/services/eval_assignment.service");
const score = require("../models/evalV2/services/eval_score.service");
// const evals = require("../models/evalv2/services/eval.service");

async function evalTest(req, res) {
    const result = await evaluation.evalTest(req.body);
    res.json(result);
}
async function createAssignment(req, res) {
    const assignment = await assign.assignEvaluation(req.body);
    res.status(201).json(assignment);
}

async function getMyAssignments(req, res) {
    const assignments = await assign.getAssignments({
        user_assigned: req.user.id
    });
    res.json(assignments);
}

async function getMyAssignments(req, res) {
    const assignments = await assign.getAssignments({
        user_assigned: req.user.id
    });
    res.json(assignments);
}

async function createScoring(req, res) {
    try {
        const data = req.body;
        const scoring = await score.createScoring(data);
        res.json({ message: "Scoring created successfully", scoring });
    } catch (err) {
        console.error(err);
        res.status(400).json({ error: err.message });
    }
}

async function submitEvaluation(req, res) {
    const { assignmentId, user_evaluation_output } = req.body;
    const updated = await assign.submitScores(
        assignmentId,
        user_evaluation_output
    );
    res.json(updated);
}
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
    submitEvaluation,
    evalTest,
    createAssignment,
    getMyAssignments,
    submitEvaluation,
    createScoring 
};
