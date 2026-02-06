module.exports = (sequelize, DataTypes) => {
    const EvaluationOutput = sequelize.define('EvaluationOutput', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        model_version_id: {
            type: DataTypes.UUID,
            allowNull: false
        },
        output_text: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        generated_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        }
    }, {
        tableName: 'evaluation_outputs',
        timestamps: true
    });

    return EvaluationOutput;
};
