const Evaluation = require("./evaluation.model");
const EvaluationScoring = require("./evaluation_scoring.model");
const EvaluationAssignment = require("./evaluation_assignment.model");

async function testModels() {
    // 1️⃣ Create Evaluation
    const evalDoc = await Evaluation.create({
        filename: "sample.json",
        rag_version: "v1.0",
        items: [
            {
                query: "What is AI?",
                rag_output: "Answer from RAG",
                reasoning_output: "Reasoning here",
                llm_response: "AI is Artificial Intelligence"
            }
        ]
    });

    // 2️⃣ Create Scoring Dimensions
    const score1 = await EvaluationScoring.create({
        dimension_name: "Accuracy",
        dimension_description: "How accurate is the response?",
        low_false_criteria: "Incorrect answer",
        high_true_criteria: "Completely correct",
        range: "0-5"
    });

    // 3️⃣ Create Assignment
    const assignment = await EvaluationAssignment.create({
        user_assigned: "user123",
        evaluation: evalDoc._id,
        evaluation_scorings: [score1._id],
        user_evaluation_output: [
            { scoring: score1._id, score: null, comments: null }
        ],
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 1 week
    });
}
module.exports = {
    testModels
};
