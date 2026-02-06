const connectPostgres = require("../config/postgres");
const { DataTypes } = require("sequelize");

const sequelize = connectPostgres();

// SQL Models
const User = require("./sql/user.model")(sequelize, DataTypes);
const PageMaintenance = require("./page_maintanance.model")(sequelize, DataTypes);

// Refactored Evaluation System Models
const ModelVersion = require("./sql/model_version.model")(sequelize, DataTypes);
const EvaluationOutput = require("./sql/evaluation_output.model")(sequelize, DataTypes);
const EvaluationCriteria = require("./sql/evaluation_criteria.model")(sequelize, DataTypes);
const EvaluationAssignment = require("./sql/evaluation_assignment.model")(sequelize, DataTypes);
const EvaluationResponse = require("./sql/evaluation_response.model")(sequelize, DataTypes);
const EvaluationNote = require("./sql/evaluation_note.model")(sequelize, DataTypes);

// Define SQL Relations
// User <-> Assignment
User.hasMany(EvaluationAssignment, { foreignKey: "user_id", as: "assignments" });
EvaluationAssignment.belongsTo(User, { foreignKey: "user_id", as: "user" });

// ModelVersion <-> EvaluationOutput
ModelVersion.hasMany(EvaluationOutput, { foreignKey: "model_version_id", as: "outputs" });
EvaluationOutput.belongsTo(ModelVersion, { foreignKey: "model_version_id", as: "modelVersion" });

// EvaluationOutput <-> EvaluationAssignment
EvaluationOutput.hasMany(EvaluationAssignment, { foreignKey: "output_id", as: "assignments" });
EvaluationAssignment.belongsTo(EvaluationOutput, { foreignKey: "output_id", as: "output" });

// EvaluationAssignment <-> EvaluationResponse
EvaluationAssignment.hasMany(EvaluationResponse, { foreignKey: "assignment_id", as: "responses" });
EvaluationResponse.belongsTo(EvaluationAssignment, { foreignKey: "assignment_id", as: "assignment" });

// EvaluationCriteria <-> EvaluationResponse
EvaluationCriteria.hasMany(EvaluationResponse, { foreignKey: "criteria_id", as: "responses" });
EvaluationResponse.belongsTo(EvaluationCriteria, { foreignKey: "criteria_id", as: "criteria" });

// EvaluationResponse <-> EvaluationNote
EvaluationResponse.hasMany(EvaluationNote, { foreignKey: "response_id", as: "notes" });
EvaluationNote.belongsTo(EvaluationResponse, { foreignKey: "response_id", as: "response" });

// Mongo Models
const Message = require("./mongo/message.model");
const Notification = require("./mongo/notification.model");
const SessionCache = require("./mongo/session.model");
const AuditLog = require("./mongo/audit_log.model");

module.exports = {
    sql: {
        sequelize,
        User,
        PageMaintenance,
        ModelVersion,
        EvaluationOutput,
        EvaluationCriteria,
        EvaluationAssignment,
        EvaluationResponse,
        EvaluationNote
    },
    mongo: {
        Message,
        Notification,
        SessionCache,
        AuditLog
    }
};
