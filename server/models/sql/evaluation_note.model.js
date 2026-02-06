module.exports = (sequelize, DataTypes) => {
    const EvaluationNote = sequelize.define('EvaluationNote', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        response_id: {
            type: DataTypes.UUID,
            allowNull: false
        },
        note: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        created_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        }
    }, {
        tableName: 'evaluation_notes',
        timestamps: true
    });

    return EvaluationNote;
};
