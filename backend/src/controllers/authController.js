const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Joi = require('joi');

// Validation schemas
const registerSchema = Joi.object({
  email: Joi.string().email().required().max(255),
  password: Joi.string().min(6).required(),
  name: Joi.string().max(255),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

/**
 * Register a new user
 */
const register = async (req, res, next) => {
  try {
    // Validate request body
    const { error, value } = registerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { email, password, name } = value;

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = await User.create(email, name, passwordHash);

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        created_at: user.created_at,
      },
      token,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Login user
 */
const login = async (req, res, next) => {
  try {
    // Validate request body
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { email, password } = value;

    // Find user by email
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Verify password - Oracle returns column names in uppercase
    const passwordHash = user.PASSWORD_HASH || user.password_hash;
    if (!passwordHash) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    const passwordMatch = await bcrypt.compare(password, passwordHash);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate JWT token - handle both uppercase and lowercase column names
    const userId = user.ID || user.id;
    const userEmail = user.EMAIL || user.email;
    const userName = user.NAME || user.name;
    const userCreatedAt = user.CREATED_AT || user.created_at;
    
    const token = jwt.sign(
      { userId, email: userEmail },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    res.json({
      message: 'Login successful',
      user: {
        id: userId,
        email: userEmail,
        name: userName,
        created_at: userCreatedAt,
      },
      token,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Logout user (client-side token invalidation)
 */
const logout = (req, res) => {
  // Since JWT is stateless, logout is handled client-side by removing token
  res.json({ message: 'Logout successful. Please remove the token client-side.' });
};

/**
 * Get current user profile
 */
const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Handle both uppercase and lowercase column names
    const userId = user.ID || user.id;
    const userEmail = user.EMAIL || user.email;
    const userName = user.NAME || user.name;
    const userCreatedAt = user.CREATED_AT || user.created_at;

    res.json({
      user: {
        id: userId,
        email: userEmail,
        name: userName,
        created_at: userCreatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update current user profile
 */
const updateProfile = async (req, res, next) => {
  try {
    const { name, email } = req.body;
    
    // Check if email already exists for another user
    if (email) {
      const existingUser = await User.findByEmail(email);
      // user.ID or user.id parsing
      const existingId = existingUser ? (existingUser.ID || existingUser.id) : null;
      if (existingUser && existingId !== req.user.userId) {
        return res.status(409).json({ error: 'Email already in use' });
      }
    }

    const updatedUser = await User.updateProfile(req.user.userId, name, email);
    
    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userId = updatedUser.ID || updatedUser.id;
    const userEmail = updatedUser.EMAIL || updatedUser.email;
    const userName = updatedUser.NAME || updatedUser.name;
    const userCreatedAt = updatedUser.CREATED_AT || updatedUser.created_at;

    // Issue a new token in case email changed
    const token = jwt.sign(
      { userId: userId, email: userEmail },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: userId,
        email: userEmail,
        name: userName,
        created_at: userCreatedAt,
      },
      token,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all users (for assignee dropdown)
 */
const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.getAll();
    res.json({ users });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  logout,
  getProfile,
  updateProfile,
  getAllUsers,
};