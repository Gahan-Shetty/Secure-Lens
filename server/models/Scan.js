const mongoose = require('mongoose');

const scanSchema = new mongoose.Schema({
  userId:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  url:         { type: String, required: true },
  status:      { type: String, enum: ['queued', 'running', 'done', 'failed'], default: 'queued' },
  score:       { type: Number, min: 0, max: 100, default: null },
  startedAt:   { type: Date, default: Date.now },
  completedAt: { type: Date, default: null },
});

module.exports = mongoose.model('Scan', scanSchema);
