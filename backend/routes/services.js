const express = require('express');
const router = express.Router();
const { getServices, getProblems } = require('../controllers/servicesController');

router.get('/', getServices);
router.get('/:category/problems', getProblems);

module.exports = router;
