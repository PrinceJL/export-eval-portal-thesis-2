const express = require("express");
const cors = require("cors");

const expertRoutes = require("./routes/expert.routes");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/expert", expertRoutes);

module.exports = app;
