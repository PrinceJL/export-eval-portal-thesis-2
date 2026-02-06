module.exports = (sequelize, DataTypes) => {
    const EvaluationResponse = sequelize.define('EvaluationResponse', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        assignment_id: {
            type: DataTypes.UUID,
            allowNull: false
        },
        criteria_id: {
            type: DataTypes.UUID,
            allowNull: false
        },
        score: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        evaluated_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        }
    }, {
        tableName: 'evaluation_responses',
        timestamps: true
    });

    return EvaluationResponse;
};
