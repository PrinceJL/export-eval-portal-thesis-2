const { Sequelize } = require("sequelize");

let sequelize;

const connectPostgres = () => {
    if (!sequelize) {
        const sslOptions = (process.env.PG_SSL === "true" || !!process.env.DATABASE_URL)
            ? {
                ssl: {
                    require: true,
                    rejectUnauthorized: false
                }
            }
            : {};

        if (process.env.DATABASE_URL) {
            sequelize = new Sequelize(process.env.DATABASE_URL, {
                dialect: "postgres",
                logging: false,
                pool: {
                    max: 5,
                    min: 0,
                    acquire: 30000,
                    idle: 10000
                },
                dialectOptions: sslOptions
            });
        } else {
            sequelize = new Sequelize(
                process.env.PG_DB,
                process.env.PG_USER,
                process.env.PG_PASSWORD,
                {
                    host: process.env.PG_HOST,
                    port: process.env.PG_PORT || 5432,
                    dialect: "postgres",
                    logging: false,
                    pool: {
                        max: 5,
                        min: 0,
                        acquire: 30000,
                        idle: 10000
                    },
                    dialectOptions: sslOptions
                }
            );
        }
    }
    return sequelize;
};

module.exports = connectPostgres;
