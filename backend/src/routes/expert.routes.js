const express = require("express");
const Evaluation = require("../services/evaluation.service");
const { validateEvaluation } = require("../services/evaluation.service");

const router = express.Router();

router.post("/save", async (req, res) => {
  const data = req.body;
  await Evaluation.findOneAndUpdate(
    { assignmentId: data.assignmentId },
    { ...data, submitted: false },
    { upsert: true }
  );
  res.json({ message: "Draft saved" });
});

router.post("/submit", async (req, res) => {
  try {
    validateEvaluation(req.body.scores);
    await Evaluation.findOneAndUpdate(
      { assignmentId: req.body.assignmentId },
      { ...req.body, submitted: true }
    );
    res.json({ message: "Evaluation submitted" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
