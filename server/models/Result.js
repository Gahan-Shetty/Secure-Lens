const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema({
  scanId:      { type: mongoose.Schema.Types.ObjectId, ref: 'Scan', required: true },
  category:    { type: String, enum: ['ssl', 'headers', 'recon', 'breach'], required: true },
  severity:    { type: String, enum: ['critical', 'high', 'medium', 'low', 'info'], required: true },
  title:       { type: String, required: true },
  description: { type: String, required: true },
  explanation: { type: String, required: true },
  remediation: { type: String, required: true },
  rawData:     { type: mongoose.Schema.Types.Mixed },
  createdAt:   { type: Date, default: Date.now },
});

module.exports = mongoose.model('Result', resultSchema);
