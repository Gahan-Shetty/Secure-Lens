const express = require('express');
const validator = require('validator');
const auth = require('../middleware/auth');
const Scan = require('../models/Scan');
const { addScanJob } = require('../queue/scanQueue');

const router = express.Router();

// POST /api/scans — start a new scan
router.post('/', auth, async (req, res) => {
  try {
    let { url } = req.body;
    if (!url) return res.status(400).json({ error: 'URL is required' });

    // Normalize URL
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }

    if (!validator.isURL(url, { require_protocol: true })) {
      return res.status(400).json({ error: 'Invalid URL format' });
    }

    const scan = await Scan.create({ userId: req.userId, url });
    await addScanJob({ scanId: scan._id.toString(), url });

    res.status(201).json({ scanId: scan._id, status: 'queued', url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/scans — get all scans for authenticated user (history)
router.get('/', auth, async (req, res) => {
  try {
    const scans = await Scan.find({ userId: req.userId })
      .sort({ startedAt: -1 })
      .limit(20);
    res.json(scans);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/scans/:id — get a single scan by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const scan = await Scan.findOne({ _id: req.params.id, userId: req.userId });
    if (!scan) return res.status(404).json({ error: 'Scan not found' });
    res.json(scan);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
