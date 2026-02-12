const { sql } = require("../models");

/**
 * Middleware to track user activity.
 * Updates lastActiveAt for authenticated users.
 */
const trackActivity = async (req, res, next) => {
    if (req.user && req.user.id) {
        // Fire and forget - don't await strictly to avoid blocking response
        // But in JS without await, errors might be unhandled. 
        // We'll wrap in try-catch blocks or use a simpler update.
        try {
            // Optimization: Only update if it's been more than 1 minute?
            // For now, simpler to just update.
            // Using raw query or direct update could be faster, but let's stick to Sequelize for safety.

            // We can't easily access the model instance here without fetching it.
            // So we do a direct update command.
            await sql.User.update(
                { lastActiveAt: new Date() },
                { where: { id: req.user.id }, silent: true } // silent: true to avoid updating 'updatedAt' if desired
            );
        } catch (error) {
            console.error("Failed to track activity:", error);
        }
    }
    next();
};

module.exports = trackActivity;
