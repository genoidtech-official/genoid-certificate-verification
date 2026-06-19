/**
 * Settings Model - Genoid Tech
 * Stores org logo, digital signature, and other config
 */

const mongoose = require('mongoose');

const SettingsSchema = new mongoose.Schema({
  key:   { type: String, unique: true, required: true },
  value: { type: String, required: true },
  updatedAt: { type: Date, default: Date.now },
});

SettingsSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Settings', SettingsSchema);
