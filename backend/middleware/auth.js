import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies?.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route. Please provide a Bearer token.',
    });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'apiforge_jwt_super_secret_key_2026_production'
    );

    const user = await User.findById(decoded.id || decoded._id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'The user belonging to this token no longer exists.',
      });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Token verification failed or token has expired.',
      error: err.message,
    });
  }
};

export const optionalAuth = async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (token) {
    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'apiforge_jwt_super_secret_key_2026_production'
      );
      req.user = await User.findById(decoded.id || decoded._id);
    } catch {
      // Ignore token failure for optional auth
    }
  }
  next();
};

export default {
  protect,
  optionalAuth,
};
