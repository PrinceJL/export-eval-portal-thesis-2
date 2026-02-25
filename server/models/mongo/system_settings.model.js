const mongoose = require('mongoose');

const systemSettingsSchema = new mongoose.Schema({
    // Use a singleton identifier for the settings document
    type: { type: String, required: true, unique: true, default: 'DASHBOARD_CONFIG' },
    dashboardTargetPerformance: { type: Number, default: 85 },
    dashboardShowDimensions: { type: Boolean, default: true },
    dashboardShowMetrics: { type: Boolean, default: true }
}, {
    timestamps: true,
    collection: 'system_settings'
});

module.exports = mongoose.model('SystemSettings', systemSettingsSchema);
