const EvaluationAssignment = require("../evaluation_assignment.model");

/**
 * CREATE assignment
 */
async function assignEvaluation(data) {
    return EvaluationAssignment.create(data);
}

/**
 * READ assignments (optionally by user)
 */
async function getAssignments(filter = {}) {
    return EvaluationAssignment.find(filter)
        .populate("evaluation")
        .populate("evaluation_scorings");
}

/**
 * READ single assignment
 */
async function getAssignmentById(id) {
    return EvaluationAssignment.findById(id)
        .populate("evaluation")
        .populate("evaluation_scorings");
}

/**
 * UPDATE evaluator scores
 */
async function submitScores(assignmentId, userEvaluationOutput) {
    return EvaluationAssignment.findByIdAndUpdate(
        assignmentId,
        {
            user_evaluation_output: userEvaluationOutput
        },
        { new: true, runValidators: true }
    );
}

/**
 * DELETE assignment (admin only)
 */
async function deleteAssignment(id) {
    return EvaluationAssignment.findByIdAndDelete(id);
}

module.exports = {
    assignEvaluation,
    getAssignments,
    getAssignmentById,
    submitScores,
    deleteAssignment
};
