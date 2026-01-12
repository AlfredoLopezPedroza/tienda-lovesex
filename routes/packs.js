const express = require('express');
const router = express.Router();

const packs = require('../data/packs');

router.get('/', (req, res) => {
  res.json({
    success: true,
    total: packs.length,
    data: packs
  });
});

module.exports = router;
