require("dotenv").config();
const mongoose = require("mongoose");
const { sql, mongo } = require("../server/models");

const seedEvaluations = async () => {
    try {
        console.log("Connecting to databases...");
        await sql.sequelize.authenticate();
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Databases connected.");

        // 1. Find an Expert User
        const expert = await sql.User.findOne({ where: { role: "EXPERT" } });
        if (!expert) {
            console.error("No EXPERT user found in SQL database. Please run seed_admin.js or create a user via Admin API first.");
            process.exit(1);
        }
        console.log(`Found expert: ${expert.username} (${expert.id})`);

        // 2. Create/Find a Scoring Definition (Dimension)
        let scoring = await mongo.EvaluationScoring.findOne({ dimension_name: "Relevance" });
        if (!scoring) {
            scoring = await mongo.EvaluationScoring.create({
                dimension_name: "Relevance",
                dimension_description: "How relevant is the answer to the query?",
                type: "Likert",
                min_range: 1,
                max_range: 5,
                criteria: [
                    { value: 1, criteria_name: "Irrelevant", description: "Completely unrelated" },
                    { value: 3, criteria_name: "Partial", description: "Somewhat relevant" },
                    { value: 5, criteria_name: "Relevant", description: "Highly relevant" }
                ]
            });
            console.log("Created 'Relevance' scoring dimension.");
        } else {
            console.log("Using existing 'Relevance' scoring dimension.");
        }

        // 3. Create 5 Evaluations and Assign them
        const assignments = [];
        for (let i = 1; i <= 5; i++) {
            // Create Evaluation (The RAG input/output content)
            const evalDoc = await mongo.EvaluationResponse.create({ // NOTE: Using Evaluation model (which is usually imported as EvaluationResponse in index.js, checking index.js...)
                // index.js exports: EvaluationResponse: require("./mongo/evaluation.model") -> WAIT.
                // Step 688 says: const EvaluationResponse = require("./mongo/evaluation.model");
                // BUT Step 859 says: server/models/evalV2/evaluation.model.js
                // AND index.js DOES NOT EXPORT evalV2 models yet?
                // Let me check index.js again.
            });
        }

    } catch (e) {
        console.error(e);
    }
}
