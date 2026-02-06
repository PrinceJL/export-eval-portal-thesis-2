require("dotenv").config();
const bcrypt = require("bcrypt");
const { sql } = require("../server/models");

const seedAdmin = async () => {
    try {
        const username = process.env.ADMIN_USERNAME;
        const password = process.env.ADMIN_PASSWORD;
        const group = process.env.ADMIN_GROUP;

        if (!username || !password || !group) {
            console.error("Missing ADMIN_USERNAME, ADMIN_PASSWORD, or ADMIN_GROUP in .env");
            process.exit(1);
        }

        // Initialize DB
        await sql.sequelize.authenticate();
        console.log("Database connected for seeding...");

        // FIX: The database still has an 'email' column with a NOT NULL constraint.
        // We need to make it nullable to match our new model.
        try {
            await sql.sequelize.query('ALTER TABLE users ALTER COLUMN email DROP NOT NULL;');
            console.log("Dropped NOT NULL constraint on email column.");
        } catch (err) {
            // Ignore if column doesn't exist or constraint already dropped
        }

        // Check if admin already exists
        const existing = await sql.User.findOne({ where: { username, group } });
        if (existing) {
            console.log(`User ${username} in group ${group} already exists.`);
            process.exit(0);
        }

        const passwordHash = await bcrypt.hash(password, 10);

        await sql.User.create({
            username,
            group,
            role: "ADMIN",
            passwordHash,
            isActive: true
        });

        console.log(`Admin user ${username} created successfully in group ${group}!`);
        process.exit(0);
    } catch (error) {
        console.error("Seeding failed:", error);
        process.exit(1);
    }
};

seedAdmin();
