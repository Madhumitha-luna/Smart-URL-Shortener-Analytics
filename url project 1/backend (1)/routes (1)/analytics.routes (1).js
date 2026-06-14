const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analytics.controller');
const auth = require('../middleware/auth');

// @route   GET api/analytics/overview
router.get('/overview', auth, analyticsController.getOverviewStats);

// @route   GET api/analytics/url/:urlId
router.get('/url/:urlId', auth, analyticsController.getUrlStats);

// @route   GET api/analytics/public/:shortCode
router.get('/public/:shortCode', analyticsController.getPublicUrlStats);

module.exports = router;
