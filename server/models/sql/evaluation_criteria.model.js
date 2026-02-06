module.exports = (sequelize, DataTypes) => {
    const EvaluationCriteria = sequelize.define('EvaluationCriteria', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        dimension_name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        description: {
            type: DataTypes.STRING, // Using STRING for short descriptions, or TEXT if longer
            allowNull: true
        },
        // Adding fields to match current UI needs even if not in ERD explicitly
        min_value: {
            type: DataTypes.INTEGER,
            defaultValue: 1
        },
        max_value: {
            type: DataTypes.INTEGER,
            defaultValue: 5
        }
    }, {
        tableName: 'evaluation_criteria',
        timestamps: true
    });

    return EvaluationCriteria;
};
