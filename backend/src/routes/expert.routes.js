const express = require("express");
// Services are now used in controllers

const router = express.Router();

const expertController = require("../controllers/expert.controller");
const validate = require("../middleware/validation.middleware");
const { evaluationSchema } = require("../models/schemas/evaluation.schema");
const authenticate = require("../middleware/auth.middleware");

// temp disable auth for easier testing
router.use(authenticate);

router.post("/test", (req, res) => {
    expertController.evalTest(req, res);
});

router.post("/assignments", expertController.createAssignment);
router.get("/assignments", expertController.getMyAssignments);
// router.get("/assignments/:id", expertController.getAssignmentById);
router.post("/assignments/:id/submit", expertController.submitEvaluation);
router.post("/scoring", authenticate, expertController.createScoring);


router.post("/save", expertController.saveDraft);

// Apply validation to submission
router.post("/submit", validate(evaluationSchema), expertController.submitEvaluation);

router.get("/ping", (req, res) => {
    res.json({ status: "ok", time: new Date() });
});

module.exports = router;
