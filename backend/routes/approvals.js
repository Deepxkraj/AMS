import express from 'express';
import User from '../models/User.js';
import Department from '../models/Department.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/approvals/pending
// @desc    Get pending approvals
// @access  Private/Admin or HOD
router.get('/pending', protect, authorize('admin', 'department_head'), async (req, res) => {
  try {
    let query = {};
    
    if (req.user.role === 'admin') {
      // Admin approval queue rules:
      // - HOD: adminApproved=false (no HOD-approval step)
      // - Technician: only show AFTER HOD has approved (hodApproved=true) and adminApproved=false
      query = {
        isActive: true,
        $or: [
          { role: 'department_head', adminApproved: false },
          { role: 'technician', hodApproved: true, adminApproved: false }
        ]
      };
    } else if (req.user.role === 'department_head') {
      query = {
        role: 'technician',
        department: req.user.department,
        hodApproved: false,
        isActive: true
      };
    }

    const users = await User.find(query)
      .select('-password')
      .populate('department', 'name')
      .sort({ createdAt: -1 });
    
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/approvals/:id/approve
// @desc    Approve user
// @access  Private/Admin or HOD
router.put('/:id/approve', protect, authorize('admin', 'department_head'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (req.user.role === 'admin') {
      // Admin only provides admin approval (final approval step for both HOD + Technician)
      if (user.role === 'department_head') {
        if (!user.department) {
          return res.status(400).json({ message: 'HOD must select a department before approval' });
        }

        const dept = await Department.findById(user.department);
        if (!dept) {
          return res.status(400).json({ message: 'Department not found' });
        }

        // one department can have only one HOD
        if (dept.hod && dept.hod.toString() !== user._id.toString()) {
          return res.status(400).json({ message: 'This department already has a Head of Department' });
        }

        dept.hod = user._id;
        await dept.save();
      }
      user.adminApproved = true;
    } else if (req.user.role === 'department_head') {
      if (user.role === 'technician' && user.department.toString() === req.user.department.toString()) {
        // HOD only provides hod approval (first-level approval for Technician)
        user.hodApproved = true;
      } else {
        return res.status(403).json({ message: 'Not authorized to approve this user' });
      }
    }

    await user.save();

    const populatedUser = await User.findById(user._id)
      .select('-password')
      .populate('department', 'name');

    res.json({ message: 'User approved successfully', user: populatedUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/approvals/:id/reject
// @desc    Reject user
// @access  Private/Admin or HOD
router.put('/:id/reject', protect, authorize('admin', 'department_head'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Deactivate user account and clear approval flags
    user.isActive = false;
    user.adminApproved = false;
    user.hodApproved = false;
    await user.save();

    res.json({ message: 'User rejected and deactivated' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;

