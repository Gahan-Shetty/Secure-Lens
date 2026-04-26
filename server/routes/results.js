const express = require('express');
const auth = require('../middleware/auth');
const Result = require('../models/Result');
const Scan = require('../models/Scan');

const router = express.Router();

// GET /api/results/:scanId — get all results for a scan
router.get('/:scanId', auth, async (req, res) => {
  try {
    // Make sure the scan belongs to this user
    const scan = await Scan.findOne({ _id: req.params.scanId, userId: req.userId });
    if (!scan) return res.status(404).json({ error: 'Scan not found' });

    const results = await Result.find({ scanId: req.params.scanId })
      .sort({ severity: 1 }); // critical first

    // Group by category
    const grouped = {
      ssl:     results.filter(r => r.category === 'ssl'),
      headers: results.filter(r => r.category === 'headers'),
      recon:   results.filter(r => r.category === 'recon'),
      breach:  results.filter(r => r.category === 'breach'),
    };

    res.json({ scan, results, grouped });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
