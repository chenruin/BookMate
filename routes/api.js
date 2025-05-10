const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');

// API endpoints
router.post('/chat', chatController.handleChatRequest);
router.post('/search', chatController.handleSearchRequest);

module.exports = router;