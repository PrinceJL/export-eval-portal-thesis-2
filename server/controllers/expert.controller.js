const { sql } = require("../models");
const { EvaluationAssignment, EvaluationOutput, ModelVersion, EvaluationCriteria, EvaluationResponse, EvaluationNote } = sql;

function getAuthedUserId(req) {
  const id = req?.user?.id;
  if (!id) {
    const err = new Error("Missing authenticated user id");
    err.statusCode = 401;
    throw err;
  }
  return id;
}

// ===== Assignment listing (SQL) =====

async function getMyAssignments(req, res) {
  try {
    const userId = getAuthedUserId(req);
    const assignments = await EvaluationAssignment.findAll({
      where: { user_id: userId },
      include: [
        {
          model: EvaluationOutput,
          as: 'output',
          include: [{ model: ModelVersion, as: 'modelVersion' }]
        }
      ],
      order: [['assigned_at', 'DESC']]
    });

    // Transform to match frontend props
    const mapped = assignments.map(a => {
      const json = a.toJSON();
      return {
        _id: json.id,
        date_assigned: json.assigned_at,
        deadline: json.deadline,
        completion_status: json.status === 'COMPLETED',
        evaluation: {
          // Formatting title from output text or ID since SQL doesn't have filename for output
          filename: `Evaluation ${json.output?.modelVersion?.model_name || 'Item'}`,
          rag_version: json.output?.modelVersion?.version || 'v1.0'
        },
        ...json
      };
    });

    res.json(mapped);
  } catch (err) {
    console.error("getMyAssignments error:", err);
    res.status(500).json({
      error: err.message || "Failed to fetch assignments"
    });
  }
}

async function getAssignmentById(req, res) {
  try {
    const userId = getAuthedUserId(req);
    const { id } = req.params;

    const assignment = await EvaluationAssignment.findOne({
      where: { id },
      include: [
        {
          model: EvaluationOutput,
          as: 'output',
          include: [{ model: ModelVersion, as: 'modelVersion' }]
        },
        {
          model: EvaluationResponse,
          as: 'responses',
          include: [
            { model: EvaluationCriteria, as: 'criteria' },
            { model: EvaluationNote, as: 'notes' }
          ]
        }
      ]
    });

    if (!assignment) return res.status(404).json({ error: "Assignment not found" });

    // Ownership check
    const isOwner = String(assignment.user_id) === String(userId);
    const isAdmin = req?.user?.role === "ADMIN" || req?.user?.role === "RESEARCHER";

    if (!isOwner && !isAdmin) return res.status(403).json({ error: "Forbidden" });

    // Also fetch all available criteria so frontend knows what to render
    const allCriteria = await EvaluationCriteria.findAll();

    // Transform response for frontend props
    const jsonObj = assignment.toJSON();

    // 1. Mock "evaluation_scorings" from allCriteria (since UI expects them assigned)
    // In SQL, criteria are global. We'll map them to the structure the UI expects.
    // Group criteria by dimension name to simulate "dimensions"
    const groupedCriteria = {};
    allCriteria.forEach(c => {
      if (!groupedCriteria[c.dimension_name]) {
        groupedCriteria[c.dimension_name] = {
          _id: `dim_${c.dimension_name}`, // Fake ID
          dimension_name: c.dimension_name,
          dimension_description: c.description,
          min_range: c.min_value || 1,
          max_range: c.max_value || 5,
          criteria: []
        };
      }
      groupedCriteria[c.dimension_name].criteria.push({
        value: 1, // SQL simplificiation: we don't store per-value desc yet, mocking
        name: "Low",
        description: "Low score"
      });
      // Add high
      groupedCriteria[c.dimension_name].criteria.push({
        value: 5,
        name: "High",
        description: "High score"
      });
    });

    const evalScorings = Object.values(groupedCriteria);

    // Parse items from output_text. 
    // Try JSON first, fallback to legacy text format
    let parsedItems = [];
    try {
      const raw = jsonObj.output?.output_text;
      if (raw && (raw.startsWith('[') || raw.startsWith('{'))) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) parsedItems = parsed;
        else if (parsed.items) parsedItems = parsed.items;
      }
    } catch (e) {
      // Ignore JSON error, try legacy
    }

    if (parsedItems.length === 0 && jsonObj.output?.output_text) {
      // Fallback Legacy: "[Query]: ... [Response]: ..."
      parsedItems = [{
        query: jsonObj.output?.output_text?.split("[Response]:")[0]?.replace("[Query]:", "")?.trim() || "Query text unavailable",
        llm_response: jsonObj.output?.output_text?.split("[Response]:")[1]?.trim() || jsonObj.output?.output_text,
        rag_output: "Hidden context",
        reasoning_output: "Hidden reasoning"
      }];
    }

    const result = {
      _id: jsonObj.id,
      date_assigned: jsonObj.assigned_at,
      deadline: jsonObj.deadline,
      completion_status: jsonObj.status === 'COMPLETED',
      evaluation: {
        _id: jsonObj.output_id,
        filename: `Evaluation ${jsonObj.output?.modelVersion?.model_name || 'Item'}`,
        rag_version: jsonObj.output?.modelVersion?.version || 'v1.0',
        items: parsedItems
      },
      evaluation_scorings: evalScorings,
      ...jsonObj
    };

    res.json(result);
  } catch (err) {
    console.error("getAssignmentById error:", err);
    res.status(500).json({
      error: err.message || "Failed to fetch assignment"
    });
  }
}

async function submitAssignmentScores(req, res) {
  try {
    const userId = getAuthedUserId(req);
    const { id } = req.params;
    const { responses } = req.body; // Expecting array of { criteria_id, score, note }

    if (!Array.isArray(responses)) {
      return res.status(400).json({ error: "responses must be an array" });
    }

    const assignment = await EvaluationAssignment.findByPk(id);
    if (!assignment) return res.status(404).json({ error: "Assignment not found" });

    if (String(assignment.user_id) !== String(userId)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    // Transactional save
    await sql.sequelize.transaction(async (t) => {
      // Clear previous responses for this assignment (simple overwrite strategy)
      // Or we could upsert. Let's destroy and recreate for simplicity unless partial updates are needed.
      // If "Draft", we might want upsert. Ideally we just wipe and rewrite for this MVP refactor.

      // Get existing response IDs to delete notes
      const existingResponses = await EvaluationResponse.findAll({ where: { assignment_id: id }, transaction: t });
      const existingResponseIds = existingResponses.map(r => r.id);

      if (existingResponseIds.length > 0) {
        await EvaluationNote.destroy({ where: { response_id: existingResponseIds }, transaction: t });
        await EvaluationResponse.destroy({ where: { assignment_id: id }, transaction: t });
      }

      for (const item of responses) {
        if (!item.criteria_id || item.score === undefined) continue;

        const response = await EvaluationResponse.create({
          assignment_id: id,
          criteria_id: item.criteria_id,
          score: item.score,
          evaluated_at: new Date()
        }, { transaction: t });

        if (item.note) {
          await EvaluationNote.create({
            response_id: response.id,
            note: item.note
          }, { transaction: t });
        }
      }

      // Update assignment status
      assignment.status = 'COMPLETED';
      assignment.completed_at = new Date();
      await assignment.save({ transaction: t });
    });

    const updated = await EvaluationAssignment.findByPk(id, {
      include: [{ model: EvaluationResponse, as: 'responses' }]
    });
    res.json(updated);

  } catch (err) {
    console.error("submitAssignmentScores error:", err);
    res.status(500).json({ error: err.message || "Failed to submit scores" });
  }
}

async function saveAssignmentDraft(req, res) {
  // Similar to submit, but doesn't mark as COMPLETED
  try {
    const userId = getAuthedUserId(req);
    const { id } = req.params;
    const { responses } = req.body;

    const assignment = await EvaluationAssignment.findByPk(id);
    if (!assignment) return res.status(404).json({ error: "Assignment not found" });

    if (String(assignment.user_id) !== String(userId)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    // Transactional save
    await sql.sequelize.transaction(async (t) => {
      // Delete existing (simplest way to handle updates for now)
      const existingResponses = await EvaluationResponse.findAll({ where: { assignment_id: id }, transaction: t });
      const existingResponseIds = existingResponses.map(r => r.id);
      if (existingResponseIds.length > 0) {
        await EvaluationNote.destroy({ where: { response_id: existingResponseIds }, transaction: t });
        await EvaluationResponse.destroy({ where: { assignment_id: id }, transaction: t });
      }

      if (Array.isArray(responses)) {
        for (const item of responses) {
          if (!item.criteria_id) continue;
          const response = await EvaluationResponse.create({
            assignment_id: id,
            criteria_id: item.criteria_id,
            score: item.score || 0, // Default to 0 if null/missing in draft
            evaluated_at: new Date()
          }, { transaction: t });

          if (item.note) {
            await EvaluationNote.create({
              response_id: response.id,
              note: item.note
            }, { transaction: t });
          }
        }
      }
      // Do NOT mark as completed
      // assignment.status = 'IN_PROGRESS'; // Optional
      // await assignment.save({ transaction: t });
    });

    res.json({ message: "Draft saved" });
  } catch (err) {
    console.error("saveAssignmentDraft error:", err);
    res.status(500).json({ error: err.message });
  }
}

async function createScoring(req, res) {
  res.status(501).json({ error: "Legacy createScoring not implemented in SQL refactor yet" });
}

async function saveDraft(req, res) {
  res.status(501).json({ error: "Legacy saveDraft not implemented" });
}

async function submitFinalEvaluation(req, res) {
  res.status(501).json({ error: "Legacy submitFinalEvaluation not implemented" });
}

// Keep generic handler for "evalTest" or remove if unused. keeping placeholder.
async function evalTest(req, res) {
  res.json({ message: "SQL Eval Controller Active" });
}

// Stub for creation (used by admin/seeding mostly, but exposed here if needed)
async function createAssignment(req, res) {
  // Admin only
  // ... impl if needed
  res.status(501).json({ error: "Not implemented in this refactor yet" });
}

module.exports = {
  evalTest,
  createAssignment,
  getMyAssignments,
  getAssignmentById,
  submitAssignmentScores,
  saveAssignmentDraft,
  createScoring,
  saveDraft,
  submitFinalEvaluation
};
