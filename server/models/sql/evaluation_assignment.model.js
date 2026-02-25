module.exports = (sequelize, DataTypes) => {
    const EvaluationAssignment = sequelize.define('EvaluationAssignment', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        user_id: {
            type: DataTypes.UUID,
            allowNull: false
            // FK to User defined in associations
        },
        output_id: {
            type: DataTypes.UUID,
            allowNull: false
            // FK to EvaluationOutput defined in associations
        },
        scoring_ids: {
            type: DataTypes.JSON,
            allowNull: true
        },
        status: {
            type: DataTypes.ENUM('PENDING', 'IN_PROGRESS', 'COMPLETED', 'EXPIRED'),
            defaultValue: 'PENDING'
        },
        assigned_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        },
        deadline: {
            type: DataTypes.DATE
        },
        completed_at: {
            type: DataTypes.DATE
        }
    }, {
        tableName: 'evaluation_assignments',
        timestamps: true
    });

    return EvaluationAssignment;
};
