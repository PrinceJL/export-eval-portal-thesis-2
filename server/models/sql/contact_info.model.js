module.exports = (sequelize, DataTypes) => {
    return sequelize.define("ContactInfo", {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        linkedinUrl: {
            type: DataTypes.STRING,
            allowNull: true
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        pictureUrl: {
            type: DataTypes.STRING,
            allowNull: true
        },
        isVisible: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        }
    }, {
        tableName: "contact_infos",
        timestamps: true
    });
};
