require("dotenv").config();
const { sql, mongo } = require("./server/models");
const mongoose = require("mongoose");

async function diagnose() {
    console.log("--- Starting Diagnostics ---");

    // 1. Check PostgreSQL
    try {
        await sql.sequelize.authenticate();
        console.log("✅ PostgreSQL: Connected");

        const userCount = await sql.User.count();
        console.log(`📊 Total Users in DB: ${userCount}`);

        if (userCount > 0) {
            const users = await sql.User.findAll({
                attributes: ['username', 'group', 'role', 'isActive'],
                limit: 5
            });
            console.log("📝 Sample Users:");
            users.forEach(u => console.log(`   - ${u.username} (Group: ${u.group}, Role: ${u.role}, Active: ${u.isActive})`));
        } else {
            console.warn("⚠️ No users found in PostgreSQL. Did you run the seed script?");
        }
    } catch (error) {
        console.error("❌ PostgreSQL: Error", error.message);
    }

    // 2. Check MongoDB
    try {
        const mongoUri = process.env.MONGO_URI || process.env.MONGO_URL;
        await mongoose.connect(mongoUri);
        console.log("✅ MongoDB: Connected");
        await mongoose.disconnect();
    } catch (error) {
        console.error("❌ MongoDB: Error", error.message);
    }

    console.log("--- End of Diagnostics ---");
    process.exit(0);
}

diagnose();
