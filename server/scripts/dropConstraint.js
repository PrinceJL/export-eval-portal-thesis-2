require('dotenv').config({ path: __dirname + '/../../.env' });
const { sql } = require('../models');

async function fixConstraints() {
    try {
        await sql.sequelize.authenticate();
        console.log("Connected to Postges.");

        await sql.sequelize.query('ALTER TABLE "evaluation_responses" DROP CONSTRAINT IF EXISTS "evaluation_responses_criteria_id_fkey" CASCADE;');
        console.log("Dropped foreign key constraint.");

        await sql.sequelize.query('ALTER TABLE "evaluation_responses" ALTER COLUMN "criteria_id" TYPE VARCHAR(255);');
        console.log("Altered column type to VARCHAR.");

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

fixConstraints();
