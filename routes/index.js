const express = require('express');
const router = express.Router();

// Home page route
router.get('/', (req, res) => {
  res.render('index', { title: 'BookMate - Your Library Pal' });
});

module.exports = router;