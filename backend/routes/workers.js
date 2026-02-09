const express = require('express');
const router = express.Router();
const { getWorkers, getWorker, getRateInsights } = require('../controllers/workersController');

router.get('/rates/insights', getRateInsights);
router.get('/', getWorkers);
router.get('/:id', getWorker);

module.exports = router;
