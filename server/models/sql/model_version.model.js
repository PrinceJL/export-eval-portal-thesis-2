module.exports = (sequelize, DataTypes) => {
    const ModelVersion = sequelize.define('ModelVersion', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        model_name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        version: {
            type: DataTypes.STRING,
            allowNull: false
        },
        released_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        }
    }, {
        tableName: 'model_versions',
        timestamps: true,
        indexes: [{ unique: true, fields: ['model_name', 'version'] }]
    });

    return ModelVersion;
};
