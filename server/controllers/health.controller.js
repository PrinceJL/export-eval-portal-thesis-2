const { sql, mongo } = require("../models");
const mongoose = require("mongoose");

async function checkHealth(req, res) {
    const health = {
        status: "OK",
        timestamp: new Date(),
        databases: {
            postgres: "UNKNOWN",
            mongodb: "UNKNOWN"
        }
    };

    try {
        // Check Postgres
        await sql.sequelize.authenticate();
        health.databases.postgres = "CONNECTED";
    } catch (error) {
        health.databases.postgres = "ERROR";
        health.status = "PARTIAL_FAILURE";
    }

    try {
        // Check MongoDB
        if (mongoose.connection.readyState === 1) {
            health.databases.mongodb = "CONNECTED";
        } else {
            health.databases.mongodb = "DISCONNECTED";
            health.status = "PARTIAL_FAILURE";
        }
    } catch (error) {
        health.databases.mongodb = "ERROR";
        health.status = "PARTIAL_FAILURE";
    }

    const statusCode = health.status === "OK" ? 200 : 500;
    return res.status(statusCode).json(health);
}

module.exports = { checkHealth };
