import express from 'express';
import { body, validationResult } from 'express-validator';
import User from '../models/User.js';
import Department from '../models/Department.js';
import { generateToken } from '../utils/generateToken.js';
import { protect, authorize } from '../middleware/auth.js';
import { upload } from '../config/multer.js';

const router = express.Router();

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email })
      .populate({
        path: 'department',
        select: 'name',
        strictPopulate: false
      });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(401).json({ message: 'Account is deactivated' });
    }

    // Check approval status (except for admin and citizen)
    if (user.role === 'department_head') {
      if (!user.adminApproved) {
        return res.status(403).json({
          message: 'Account pending approval',
          pendingApprovals: { admin: true, hod: false }
        });
      }
    }
    if (user.role === 'technician') {
      if (!user.adminApproved || !user.hodApproved) {
        return res.status(403).json({
          message: 'Account pending approval',
          pendingApprovals: {
            admin: !user.adminApproved,
            hod: !user.hodApproved
          }
        });
      }
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    res.json({
      token: generateToken(user._id),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/auth/signup
// @desc    Register new user (Department Head, Technician, Citizen)
// @access  Public
router.post('/signup', upload.single('idProof'), [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').isIn(['department_head', 'technician', 'citizen']).withMessage('Invalid role')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, role, department, phone } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // For Department Head and Technician, validate required fields
    if ((role === 'department_head' || role === 'technician') && !department) {
      return res.status(400).json({ message: 'Department is required' });
    }

    if ((role === 'department_head' || role === 'technician') && !phone) {
      return res.status(400).json({ message: 'Phone is required' });
    }

    if ((role === 'department_head' || role === 'technician') && !req.file) {
      return res.status(400).json({ message: 'ID proof is required' });
    }

    // Check if department exists
    let dept = null;
    if (department) {
      dept = await Department.findById(department);
      if (!dept) {
        return res.status(400).json({ message: 'Department not found' });
      }

      // For Department Head signup: prevent selecting a department that already has a Department Head
      if (role === 'department_head' && dept.hod) {
        return res.status(400).json({
          message: 'This department already has a Head of Department. Please contact admin.'
        });
      }
    }

    // Create user
    // Approval rules:
    // - citizen: no approval required
    // - department_head: admin approval required, hodApproved is implicitly true
    // - technician: both admin and hod approval required
    const userData = {
      name,
      email,
      password,
      role,
      adminApproved: role === 'citizen' ? true : false,
      hodApproved: role === 'technician' ? false : true
    };

    if (role === 'department_head' || role === 'technician') {
      userData.department = department;
      userData.phone = phone;
      userData.idProof = req.file ? `/uploads/id-proofs/${req.file.filename}` : null;
    }

    const user = await User.create(userData);

    res.status(201).json({
      message: 'Registration successful. Please wait for approval.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        adminApproved: user.adminApproved,
        hodApproved: user.hodApproved
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password')
      .populate({
        path: 'department',
        select: 'name',
        strictPopulate: false
      });
    
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;

