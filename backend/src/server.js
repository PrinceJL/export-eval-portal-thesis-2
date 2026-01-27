require("dotenv").config();
const app = require("./app");
const connectMongo = require("./config/mongo");

connectMongo();

app.listen(3000, () => {
    console.log("Server running on port 3000");
});
