const bcrypt = require("bcrypt");

const { sql } = require("../models");
const { Op } = require("sequelize");
const notificationService = require("../services/notification.service");

// Eval V2 services
const evalService = require("../models/evalV2/services/eval.service");
const scoringService = require("../models/evalV2/services/eval_score.service");
const assignmentService = require("../models/evalV2/services/eval_assignment.service");

function genTempPassword() {
  // 12 chars, mix of letters and digits
  return `Temp${Math.random().toString(36).slice(2, 10)}!`;
}

// ------------------ USERS ------------------

async function listUsers(req, res) {
  try {
    const where = {};
    if (req.query.group) where.group = req.query.group;
    if (req.query.role) where.role = req.query.role;
    if (req.query.active === "true") where.isActive = true;
    if (req.query.active === "false") where.isActive = false;

    const users = await sql.User.findAll({
      where,
      order: [["createdAt", "DESC"]],
      attributes: { exclude: ["passwordHash"] }
    });
    res.json(users);
  } catch (e) {
    res.status(500).json({ error: "Failed to list users" });
  }
}

async function createUser(req, res) {
  try {
    const { username, email, group, role } = req.body;
    let { password } = req.body;

    if (!username || !group || !role) {
      return res.status(400).json({ error: "Missing username/group/role" });
    }

    if (!["ADMIN", "EXPERT", "RESEARCHER"].includes(role)) {
      return res.status(400).json({ error: "Invalid role" });
    }

    if (!password) password = genTempPassword();
    const passwordHash = await bcrypt.hash(password, 10);

    const user = await sql.User.create({
      username,
      email,
      group,
      role,
      passwordHash,
      isActive: true
    });

    res.status(201).json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        group: user.group,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt
      },
      temporaryPassword: password
    });
  } catch (e) {
    // Friendly unique constraint errors
    const msg = String(e?.message || "");
    if (msg.includes("username") && msg.includes("group")) {
      return res.status(409).json({ error: "Username already exists for this group" });
    }
    return res.status(500).json({ error: "Failed to create user" });
  }
}

async function updateUser(req, res) {
  try {
    const { id } = req.params;
    const { email, group, role, isActive, resetPassword } = req.body;

    const user = await sql.User.findByPk(id);
    if (!user) return res.status(404).json({ error: "User not found" });

    if (email !== undefined) user.email = email;
    if (group !== undefined) user.group = group;
    if (role !== undefined) user.role = role;
    if (isActive !== undefined) user.isActive = !!isActive;

    let newTempPassword = null;
    if (resetPassword) {
      newTempPassword = genTempPassword();
      user.passwordHash = await bcrypt.hash(newTempPassword, 10);
    }

    await user.save();

    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        group: user.group,
        role: user.role,
        isActive: user.isActive,
        updatedAt: user.updatedAt
      },
      ...(newTempPassword ? { temporaryPassword: newTempPassword } : {})
    });
  } catch (e) {
    res.status(500).json({ error: "Failed to update user" });
  }
}

// ------------------ SCORINGS ------------------

async function listScorings(req, res) {
  try {
    const scorings = await scoringService.getScorings();
    res.json(scorings);
  } catch (e) {
    res.status(500).json({ error: "Failed to list scorings" });
  }
}

async function createScoring(req, res) {
  try {
    const scoring = await scoringService.createScoring(req.body);
    res.status(201).json(scoring);
  } catch (e) {
    res.status(400).json({ error: e.message || "Failed to create scoring" });
  }
}

// ------------------ EVALUATIONS ------------------

async function listEvaluations(req, res) {
  try {
    // In SQL, "Evaluations" are effectively EvaluationOutputs tied to ModelVersions
    // or we can allow assigning specific ModelVersions.
    // Let's return ModelVersions that have outputs, or just EvaluationOutputs directly.
    // For simplicity in assignment, we list EvaluationOutputs.
    const outputs = await sql.EvaluationOutput.findAll({
      include: [{ model: sql.ModelVersion, as: 'modelVersion' }],
      order: [['createdAt', 'DESC']]
    });

    // Transform to friendly format
    const mapped = outputs.map(o => {
      let items = [];
      try {
        const parsed = JSON.parse(o.output_text);
        if (Array.isArray(parsed)) {
          items = parsed;
        } else if (parsed && Array.isArray(parsed.items)) {
          items = parsed.items;
        } else {
          // Fallback for flat object or single item
          items = [parsed];
        }
      } catch (e) {
        // Fallback for legacy text format
        if (o.output_text && o.output_text.trim()) {
          items = [{
            query: o.output_text.split("[Response]:")[0]?.replace("[Query]:", "")?.trim() || "Query text unavailable",
            llm_response: o.output_text.split("[Response]:")[1]?.trim() || o.output_text
          }];
        }
      }

      return {
        id: o.id,
        filename: `Evaluation ${o.modelVersion?.model_name || 'Item'}`,
        rag_version: o.modelVersion?.version || 'v1.0',
        createdAt: o.createdAt,
        items: items // Return actual items
      };
    });

    res.json(mapped);
  } catch (e) {
    console.error("listEvaluations error:", e);
    res.status(500).json({ error: "Failed to list evaluations" });
  }
}

async function createEvaluation(req, res) {
  // Creating a new "Evaluation" in SQL means creating a ModelVersion + Output + Criteria?
  // or just utilizing existing seeding scripts. 
  // For this MVP, we might stick to " Assignments are created from EXISTING outputs".
  // But if the user wants to "Create" one, we'd need a text input.
  try {
    const { filename, rag_version, items } = req.body;
    // This is complex for SQL structure (ModelVersion -> Output).
    // Let's implement a basic version that creates a ModelVersion and Output.

    // 1. Create/Find ModelVersion
    const [version] = await sql.ModelVersion.findOrCreate({
      where: { version: rag_version || 'v1.0', model_name: filename || 'Custom Eval' }
    });

    // 2. Create Output
    // items is array of { query, llm_response... }
    // We store this as one big text blob in `output_text` for now, matching the `expert.controller.js` parsing logic.
    // "[Query]: ... [Response]: ..."
    // 2. Create Output
    // items is array of { query, llm_response... }
    // Serialize ALL items to JSON
    const outputText = JSON.stringify(items);

    const output = await sql.EvaluationOutput.create({
      model_version_id: version.id,
      output_text: outputText
    });

    res.status(201).json(output);
  } catch (e) {
    console.error("createEvaluation error:", e);
    res.status(400).json({ error: e.message || "Failed to create evaluation" });
  }
}

// ------------------ ASSIGNMENTS ------------------

async function listAssignments(req, res) {
  try {
    const filter = {};
    if (req.query.user_assigned) filter.user_assigned = req.query.user_assigned; // note: user_assigned is user_id in SQL model? No, let's check model.
    // In SQL model: user_id is the FK.

    // The SQL model has `user_id`, but the legacy API used `user_assigned`.
    // Let's support both or standardized to `user_id`.
    // The endpoint likely receives `user_assigned` from legacy calls.

    const where = {};
    if (req.query.user_assigned) where.user_id = req.query.user_assigned;

    // Get total criteria count for progress calculation
    const totalCriteria = await sql.EvaluationCriteria.count();

    const assignments = await sql.EvaluationAssignment.findAll({
      where,
      include: [
        {
          model: sql.User,
          as: 'user',
          attributes: ['id', 'username', 'email']
        },
        {
          model: sql.EvaluationOutput,
          as: 'output',
          include: [{ model: sql.ModelVersion, as: 'modelVersion' }]
        },
        {
          model: sql.EvaluationResponse,
          as: 'responses',
          attributes: ['id'] // Only need count
        }
      ],
      order: [['assigned_at', 'DESC']]
    });

    // Remap for frontend consistency
    const mapped = assignments.map(a => {
      const responseCount = a.responses?.length || 0;
      // If no criteria defined, progress is 0 or 100 based on status? Let's use criteria count.
      // If totalCriteria is 0, avoid NaN by setting percentage to 0 (or 100 if completed?). 
      // Safest is 0 if no criteria.
      const progress = totalCriteria > 0 ? Math.min(100, Math.round((responseCount / totalCriteria) * 100)) : 0;

      return {
        id: a.id,
        user: a.user,
        evaluation: {
          id: a.output?.id,
          filename: `Evaluation ${a.output?.modelVersion?.model_name || 'Item'}`,
          rag_version: a.output?.modelVersion?.version
        },
        status: a.status,
        deadline: a.deadline,
        assigned_at: a.assigned_at,
        completed_at: a.completed_at,
        progress: progress,
        responses_count: responseCount,
        total_criteria: totalCriteria
      };
    });

    res.json(mapped);
  } catch (e) {
    console.error("listAssignments error:", e);
    res.status(500).json({ error: "Failed to list assignments" });
  }
}

async function createAssignment(req, res) {
  try {
    const { user_assigned, evaluation, deadline } = req.body;
    // user_assigned = user_id
    // evaluation = output_id

    if (!user_assigned || !evaluation) {
      return res.status(400).json({ error: "Missing user_assigned or evaluation ID" });
    }

    const assignment = await sql.EvaluationAssignment.create({
      user_id: user_assigned,
      output_id: evaluation,
      deadline: deadline ? new Date(deadline) : null,
      status: 'PENDING'
    });

    // Notification
    try {
      await notificationService.createNotification(
        String(user_assigned),
        "assignment",
        "New evaluation assigned",
        "You have a new evaluation assignment.",
        { assignmentId: assignment.id }
      );
    } catch (err) {
      console.error("Notification error:", err);
    }

    res.status(201).json(assignment);
  } catch (e) {
    console.error("createAssignment error:", e);
    res.status(400).json({ error: e.message || "Failed to create assignment" });
  }
}

async function updateAssignment(req, res) {
  try {
    const { id } = req.params;
    const { deadline, status } = req.body;

    const assignment = await sql.EvaluationAssignment.findByPk(id);
    if (!assignment) return res.status(404).json({ error: "Assignment not found" });

    if (deadline !== undefined) assignment.deadline = deadline ? new Date(deadline) : null;
    if (status !== undefined) assignment.status = status;

    await assignment.save();
    res.json(assignment);
  } catch (e) {
    res.status(500).json({ error: "Failed to update assignment" });
  }
}

async function deleteAssignment(req, res) {
  try {
    const { id } = req.params;
    const deleted = await sql.EvaluationAssignment.destroy({ where: { id } });
    if (!deleted) return res.status(404).json({ error: "Assignment not found" });
    res.json({ message: "Assignment deleted" });
  } catch (e) {
    res.status(500).json({ error: "Failed to delete assignment" });
  }
}

// ------------------ MAINTENANCE ------------------

async function getMaintenance(req, res) {
  try {
    const PageMaintenance = sql.PageMaintenance;
    const [global] = await PageMaintenance.findOrCreate({
      where: { pageName: "GLOBAL" },
      defaults: { isUnderMaintenance: false, maintenanceMessage: "" }
    });
    const pages = await PageMaintenance.findAll({ order: [["pageName", "ASC"]] });
    res.json({ global, pages });
  } catch (e) {
    res.status(500).json({ error: "Failed to load maintenance settings" });
  }
}

async function setMaintenance(req, res) {
  try {
    const PageMaintenance = sql.PageMaintenance;
    const { pageName, isUnderMaintenance, maintenanceMessage, scheduledStart, scheduledEnd } = req.body;
    if (!pageName) return res.status(400).json({ error: "Missing pageName" });

    const [row] = await PageMaintenance.findOrCreate({
      where: { pageName },
      defaults: {
        isUnderMaintenance: !!isUnderMaintenance,
        maintenanceMessage: maintenanceMessage || "",
        scheduledStart: scheduledStart ? new Date(scheduledStart) : null,
        scheduledEnd: scheduledEnd ? new Date(scheduledEnd) : null,
        updatedBy: req.user.id
      }
    });

    row.isUnderMaintenance = isUnderMaintenance !== undefined ? !!isUnderMaintenance : row.isUnderMaintenance;
    if (maintenanceMessage !== undefined) row.maintenanceMessage = maintenanceMessage;
    if (scheduledStart !== undefined) row.scheduledStart = scheduledStart ? new Date(scheduledStart) : null;
    if (scheduledEnd !== undefined) row.scheduledEnd = scheduledEnd ? new Date(scheduledEnd) : null;
    row.updatedBy = req.user.id;
    await row.save();

    res.json(row);
  } catch (e) {
    res.status(500).json({ error: "Failed to update maintenance" });
  }
}

async function getDashboardStats(req, res) {
  try {
    const userCount = await sql.User.count();

    // Count users active in last 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const onlineCount = await sql.User.count({
      where: {
        lastActiveAt: {
          [Op.gte]: fiveMinutesAgo
        }
      }
    });

    const evaluationCount = await sql.EvaluationAssignment.count();
    const completedCount = await sql.EvaluationAssignment.count({ where: { status: 'COMPLETED' } });
    const pendingCount = await sql.EvaluationAssignment.count({ where: { status: 'PENDING' } });

    res.json({
      users: {
        total: userCount,
        online: onlineCount
      },
      evaluations: {
        total: evaluationCount,
        completed: completedCount,
        pending: pendingCount
      }
    });
  } catch (e) {
    console.error("Stats Error:", e);
    res.status(500).json({ error: "Failed to fetch dashboard stats" });
  }
}

module.exports = {
  // users
  listUsers,
  createUser,
  updateUser,
  // scorings
  listScorings,
  createScoring,
  // evaluations
  listEvaluations,
  createEvaluation,
  // assignments
  listAssignments,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  // maintenance
  getMaintenance,
  setMaintenance,
  getDashboardStats
};
