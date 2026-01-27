const express = require("express");
// Services are now used in controllers

const router = express.Router();

const expertController = require("../controllers/expert.controller");
const validate = require("../middleware/validation.middleware");
const { evaluationSchema } = require("../models/schemas/evaluation.schema");
const authenticate = require("../middleware/auth.middleware");

router.use(authenticate);

router.post("/save", expertController.saveDraft);

// Apply validation to submission
router.post("/submit", validate(evaluationSchema), expertController.submitEvaluation);

module.exports = router;
