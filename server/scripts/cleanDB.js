require('dotenv').config({ path: __dirname + '/../../.env' });
const { sql, mongo } = require('../models');
const mongoose = require('mongoose');

async function cleanDB() {
    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("MongoDB connected.");

        console.log("Connecting to Postgres...");
        await sql.sequelize.authenticate();
        console.log("Postgres connected.");

        console.log("Cleaning Postgres tables (except Users and PageMaintenance)...");

        // Destroy in order to respect foreign key constraints
        await sql.EvaluationNote.destroy({ where: {} });
        await sql.EvaluationResponse.destroy({ where: {} });
        await sql.EvaluationAssignment.destroy({ where: {} });
        await sql.EvaluationCriteria.destroy({ where: {} });
        await sql.EvaluationOutput.destroy({ where: {} });
        await sql.ModelVersion.destroy({ where: {} });
        await sql.ContactInfo.destroy({ where: {} });

        console.log("Postgres tables cleaned.");

        const EvaluationScoring = require('../models/evalV2/evaluation_scoring.model');

        console.log("Cleaning Mongo collections...");
        await EvaluationScoring.deleteMany({});
        await mongo.Message.deleteMany({});
        await mongo.Notification.deleteMany({});
        await mongo.SessionCache.deleteMany({});
        await mongo.AuditLog.deleteMany({});
        console.log("Mongo collections cleaned.");

        console.log("Database cleanup completed successfully.");
        process.exit(0);
    } catch (error) {
        console.error("Error cleaning database:", error);
        process.exit(1);
    }
}

cleanDB();
