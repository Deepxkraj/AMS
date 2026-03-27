import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ message: 'Not authorized, no token' });
    }

    try {
      const secret = process.env.JWT_SECRET || 'dev_jwt_secret_change_me';
      const decoded = jwt.verify(token, secret);
      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }

      // Check if user is active
      if (!user.isActive) {
        return res.status(401).json({ message: 'Account is deactivated' });
      }

      // Check approval status
      // - department_head: requires adminApproved
      // - technician: requires adminApproved + hodApproved
      if (user.role === 'department_head') {
        if (!user.adminApproved) {
          return res.status(403).json({
            message: 'Account pending admin approval. Please wait for admin approval.'
          });
        }
      }
      if (user.role === 'technician') {
        if (!user.adminApproved || !user.hodApproved) {
          return res.status(403).json({
            message: 'Account pending approval. Please wait for admin and HOD approval.'
          });
        }
      }

      req.user = user;
      next();
    } catch (error) {
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `User role '${req.user.role}' is not authorized to access this route` 
      });
    }
    next();
  };
};

