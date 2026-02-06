require("dotenv").config();
const { sql } = require("./server/models");

const checkUsers = async () => {
    try {
        await sql.sequelize.authenticate();
        const users = await sql.User.findAll({ attributes: ["id", "username", "role", "group", "isActive"] });
        console.log("Current Users in DB:");
        console.log(JSON.stringify(users, null, 2));
        process.exit(0);
    } catch (error) {
        console.error("Failed to check users:", error);
        process.exit(1);
    }
};

checkUsers();
