// models/mongo/evaluation_assignment.model.js
const mongoose = require("mongoose");
const { Schema } = mongoose;

const EvaluationAssignmentSchema = new Schema({
    user_assigned: { type: String, required: true },
    evaluation: { type: Schema.Types.ObjectId, ref: "Evaluation", required: true },
    evaluation_scorings: [{ type: Schema.Types.ObjectId, ref: "EvaluationScoring" }],

    user_evaluation_output: [{
        scoring: { type: Schema.Types.ObjectId, ref: "EvaluationScoring" },
        score: { type: String, default: null },
        comments: { type: String, default: null },
    }],

    date_assigned: { type: Date, default: Date.now },
    deadline: { type: Date },
    completion_status: { type: Boolean, default: false },
}, { timestamps: true });

EvaluationAssignmentSchema.pre("save", function () {
    if (
        Array.isArray(this.user_evaluation_output) &&
        this.user_evaluation_output.every(
            e => e.score !== null && e.score !== undefined
        )
    ) {
        this.completion_status = true;
    } else {
        this.completion_status = false;
    }
});


module.exports = mongoose.model("EvaluationAssignment", EvaluationAssignmentSchema);
