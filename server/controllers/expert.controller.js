const { sql, mongo } = require("../models");
const { EvaluationAssignment, EvaluationOutput, ModelVersion, EvaluationResponse, EvaluationNote } = sql;

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
      // Fallback for older items that don't have a modelVersion
      let fallbackName = 'Item';
      if (!json.output?.modelVersion?.model_name && json.output?.output_text) {
        try {
          // If the output text is standard JSON string from legacy endpoints
          // It might be small enough to just use a substring or simply default to 'Legacy Evaluation'
          fallbackName = 'Legacy Evaluation';
        } catch (e) { }
      }

      return {
        _id: json.id,
        date_assigned: json.assigned_at,
        deadline: json.deadline,
        completion_status: json.status === 'COMPLETED',
        evaluation: {
          id: json.output?.id,
          filename: json.output?.modelVersion?.model_name || fallbackName,
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

async function getExpertStats(req, res) {
  try {
    const userId = getAuthedUserId(req);

    // 1. Fetch Assignments
    const assignments = await EvaluationAssignment.findAll({
      where: { user_id: userId },
      include: [
        {
          model: EvaluationResponse,
          as: 'responses'
        },
        {
          model: EvaluationOutput,
          as: 'output',
          include: [{ model: ModelVersion, as: 'modelVersion' }]
        }
      ],
      order: [['deadline', 'ASC']]
    });

    const evaluations = assignments.map(a => {
      const json = a.toJSON();
      let fallbackName = 'Item';
      if (!json.output?.modelVersion?.model_name && json.output?.output_text) {
        try {
          fallbackName = 'Legacy Evaluation';
        } catch (e) { }
      }
      return {
        _id: json.id,
        date_assigned: json.assigned_at,
        deadline: json.deadline,
        completion_status: json.status === 'COMPLETED',
        evaluation: {
          id: json.output?.id,
          filename: json.output?.modelVersion?.model_name || fallbackName,
          rag_version: json.output?.modelVersion?.version || 'v1.0'
        },
        ...json
      };
    });

    // 2. Fetch Active Dimensions
    // Try to rely on EvaluationScoring (MongoDB) for dimensions instead since it's the active system
    let rawDimensions = [];
    try {
      rawDimensions = await mongo.mongoose.connection.db.collection('evaluationscorings').find({}).toArray();
    } catch (e) {
      // fallback if model isn't directly exposed
      const evalSchema = require('../models/evalV2/evaluation_scoring.model');
      rawDimensions = await evalSchema.find({});
    }

    // 3. Compute Dimension Performance
    const dimensionStats = {};
    rawDimensions.forEach(dim => {
      dimensionStats[dim._id.toString()] = {
        name: dim.name,
        type: dim.type,
        description: dim.description || '',
        totalScore: 0,
        count: 0
      };
    });

    let totalPossibleScore = 0;
    let earnedScore = 0;

    assignments.forEach(assignment => {
      if (assignment.status === 'COMPLETED' && Array.isArray(assignment.responses)) {
        assignment.responses.forEach(response => {
          const criteriaId = response.criteria_id;
          const score = parseFloat(response.score) || 0;

          if (dimensionStats[criteriaId]) {
            dimensionStats[criteriaId].totalScore += score;
            dimensionStats[criteriaId].count++;
          }

          // For overall circular progress (simple sum/max logic for now)
          // Normalize boolean to 0-5 mapping just for visual stats, or just use raw score if likert
          let normalizedScore = score;
          if (dimensionStats[criteriaId] && dimensionStats[criteriaId].type === 'boolean') {
            normalizedScore = score > 0 ? 5 : 0;
          }
          earnedScore += normalizedScore;
          totalPossibleScore += 5; // Assuming max 5 scale for Likert and mapped Boolean
        });
      }
    });

    const dimensions = [];
    Object.keys(dimensionStats).forEach(key => {
      const stat = dimensionStats[key];
      if (stat.count > 0) {
        const avg = stat.totalScore / stat.count;
        let sentiment = 'neutral';
        if (stat.type === 'likert') {
          if (avg >= 4) sentiment = 'positive';
          else if (avg <= 2) sentiment = 'negative';
        } else {
          if (avg >= 0.8) sentiment = 'positive';
          else if (avg <= 0.4) sentiment = 'negative';
        }

        dimensions.push({
          _id: key,
          name: stat.name,
          description: stat.description,
          avgScore: avg.toFixed(1),
          sentiment
        });
      }
    });

    // 4. Fetch Global Settings
    let settings = {
      dashboardTargetPerformance: 85,
      dashboardShowDimensions: true,
      dashboardShowMetrics: true
    };

    try {
      const SystemSettings = require('../models/mongo/system_settings.model');
      const dbSettings = await SystemSettings.findOne({ type: 'DASHBOARD_CONFIG' });
      if (dbSettings) {
        settings = dbSettings;
      }
    } catch (e) {
      console.warn("Could not fetch global dashboard settings", e);
    }

    // 5. Build final payload
    res.json({
      evaluations,
      dimensions,
      settings,
      performance: {
        totalPossibleScore,
        earnedScore
      }
    });

  } catch (err) {
    console.error("getExpertStats error:", err);
    res.status(500).json({ error: "Failed to fetch expert stats" });
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
    const EvaluationScoring = require("../models/evalV2/evaluation_scoring.model");
    const allCriteria = await EvaluationScoring.find();

    // Transform response for frontend props
    const jsonObj = assignment.toJSON();

    // Filter to only included dimensions if scoring_ids exist on the assignment
    let activeCriteria = allCriteria;
    if (Array.isArray(jsonObj.scoring_ids) && jsonObj.scoring_ids.length > 0) {
      activeCriteria = allCriteria.filter(c => jsonObj.scoring_ids.includes(c._id.toString()));
    }

    // Map Mongo objects directly to UI shape
    const evalScorings = activeCriteria.map(c => ({
      _id: c._id.toString(),
      dimension_name: c.dimension_name,
      dimension_description: c.dimension_description,
      min_range: c.min_range,
      max_range: c.max_range,
      type: c.type,
      criteria: c.criteria
    }));

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
      include: [] // Remove the old responses include which triggered the 500
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
  submitFinalEvaluation,
  getExpertStats
};
