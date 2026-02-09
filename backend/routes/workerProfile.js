const express = require('express');
const router = express.Router();
const { protectWorker } = require('../middleware/workerAuth');
const { getWorkerProfile, updateWorkerProfile } = require('../controllers/workerProfileController');

router.get('/', protectWorker, getWorkerProfile);
router.post('/', protectWorker, updateWorkerProfile);

module.exports = router;
