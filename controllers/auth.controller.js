const User = require('../models/user.model');
const jwt = require('jsonwebtoken');

// Helper function to generate JWT token and set it as an httpOnly cookie
const sendTokenResponse = (user, statusCode, res) => {
  // Ensure JWT_COOKIE_EXPIRE is parsed as a number, defaulting to 30 days if not set
  const cookieExpireDays = parseInt(process.env.JWT_COOKIE_EXPIRE || '30', 10);
  console.log('DEBUG: JWT_COOKIE_EXPIRE (parsed) value:', cookieExpireDays); // Added for debugging

  const token = generateToken(user._id);

  const options = {
    // CORRECTED: Create a Date object for the expiry
    expires: new Date(Date.now() + cookieExpireDays * 24 * 60 * 60 * 1000), 
    httpOnly: true, // Prevents client-side JS from accessing the cookie
    secure: process.env.NODE_ENV === 'production', // Only send over HTTPS in production
    sameSite: 'Lax', // Protects against CSRF attacks (e.g., 'Strict', 'Lax', 'None')
  };

  // If you're running on localhost with http, secure: true will prevent cookie from being set.
  // Temporarily set secure to false for development if not using HTTPS locally.
  if (process.env.NODE_ENV === 'development') {
    options.secure = false;
  }

  res.status(statusCode).cookie('token', token, options).json({
    success: true,
    // Do NOT send the token in the JSON response if it's in an httpOnly cookie
    // token: token, // REMOVED: Token is now in cookie
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      // Add other user fields you want to send to the frontend
      phone: user.phone,
      address: user.address,
    },
  });
};

// Register a new user
exports.register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Create new user
    const user = new User({
      name,
      email,
      password
    });

    console.log('User object created, attempting to save...');

    await user.save();
    console.log('User saved successfully');

    // Send token as cookie
    sendTokenResponse(user, 201, res);

  } catch (error) {
    console.error('Error during user registration:', error); // Added error logging
    next(error); // Pass error to Express error handling middleware
  }
};

// Login user
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Validate password
    // IMPORTANT: Make sure user.comparePassword is correctly implemented in user.model.js
    // and is NOT temporarily bypassed (return await bcrypt.compare(candidatePassword, this.password);)
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Send token as cookie
    sendTokenResponse(user, 200, res);

  } catch (error) {
    console.error('Error during user login:', error); // Added error logging
    next(error);
  }
};

// Logout user (by clearing the cookie)
// @route   GET /api/auth/logout
// @access  Private
exports.logout = (req, res) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000), // Expire quickly (10 seconds)
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Lax',
  });

  // Temporarily set secure to false for development if not using HTTPS locally.
  if (process.env.NODE_ENV === 'development') {
    res.cookie('token', 'none', {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true,
      secure: false, // For local HTTP development
      sameSite: 'Lax',
    });
  }

  res.status(200).json({ success: true, message: 'Logged out successfully' });
};


// Generate JWT token
const generateToken = (id) => {
  // Ensure JWT_EXPIRE is a valid string for jsonwebtoken
  // Default to '30d' if not set or invalid
  const expiresIn = process.env.JWT_EXPIRE || '30d'; 
  console.log('DEBUG: JWT_EXPIRE value:', expiresIn); // Added for debugging

  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: expiresIn, // Use the validated expiresIn
  });
};