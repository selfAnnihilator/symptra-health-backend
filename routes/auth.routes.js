const express = require('express');
const { register, login, logout } = require('../controllers/auth.controller');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/logout', logout); // Ensure this route is present and uses GET

module.exports = router;
