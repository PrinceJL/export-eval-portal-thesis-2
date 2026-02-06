require("dotenv").config();
const app = require("../server/app");
const connectMongo = require("../server/config/mongo");
const { sql } = require("../server/models/index");

// Initializing DB connections
const startServerless = async () => {
    try {
        await connectMongo();
        // Sequelize sync is generally avoided in every serverless hit, 
        // but here we ensure models are initialized.
        // In fully production environments, migrations should be used.
        await sql.sequelize.authenticate();
        console.log("Database connections initialized for serverless function");
    } catch (error) {
        console.error("Database initialization failed:", error);
    }
};

startServerless();

// Export the app as a serverless function
module.exports = app;
