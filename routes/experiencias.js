const express = require('express');
const router = express.Router();

const experiencias = require('../data/experiencias');

router.get('/', (req, res) => {
  res.json({
    success: true,
    total: experiencias.length,
    data: experiencias
  });
});

module.exports = router;
