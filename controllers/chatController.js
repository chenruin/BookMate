const deepseekService = require('../services/deepseekService');

/**
 * Handle chat requests from the client
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function handleChatRequest(req, res) {
  try {
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const response = await deepseekService.getBookRecommendation(message);
    
    res.json({ response });
  } catch (error) {
    console.error('Chat controller error:', error);
    res.status(500).json({ error: 'Failed to process your request' });
  }
}

/**
 * Handle search requests from the client
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function handleSearchRequest(req, res) {
  try {
    const { query } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const formattedQuery = `I'm looking for book recommendations about: ${query}`;
    const response = await deepseekService.getBookRecommendation(formattedQuery);
    
    res.json({ response });
  } catch (error) {
    console.error('Search controller error:', error);
    res.status(500).json({ error: 'Failed to process your search request' });
  }
}

module.exports = {
  handleChatRequest,
  handleSearchRequest
};