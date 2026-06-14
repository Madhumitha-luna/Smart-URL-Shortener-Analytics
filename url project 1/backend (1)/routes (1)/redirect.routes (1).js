const express = require('express');
const router = express.Router();
const redirectController = require('../controllers/redirect.controller');

// @route   GET /:shortCode
router.get('/:shortCode', redirectController.handleRedirect);

module.exports = router;
