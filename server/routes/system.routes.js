const express = require("express");
const systemController = require("../controllers/system.controller");
const healthController = require("../controllers/health.controller");

const router = express.Router();

// Public endpoint used by frontend to show a 503 / maintenance page
router.get("/maintenance", systemController.getMaintenance);

// System health check
router.get("/health", healthController.checkHealth);

module.exports = router;
