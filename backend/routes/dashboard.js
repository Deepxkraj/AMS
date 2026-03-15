import express from 'express';
import Asset from '../models/Asset.js';
import Complaint from '../models/Complaint.js';
import User from '../models/User.js';
import Department from '../models/Department.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/dashboard/stats
// @desc    Get dashboard statistics
// @access  Private
router.get('/stats', protect, async (req, res) => {
  try {
    let stats = {};

    if (req.user.role === 'admin') {
      const totalAssets = await Asset.countDocuments();
      const totalComplaints = await Complaint.countDocuments();
      // Pending approval count should match approval-queue rules:
      // - Department Head pending: adminApproved=false
      // - Technician pending: hodApproved=true AND adminApproved=false
      // Only count active users
      const pendingApprovals = await User.countDocuments({
        isActive: true,
        $or: [
          { role: 'department_head', adminApproved: false },
          { role: 'technician', hodApproved: true, adminApproved: false }
        ]
      });
      const totalDepartments = await Department.countDocuments();
      
      const assetsByStatus = await Asset.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]);

      const complaintsByStatus = await Complaint.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]);

      stats = {
        totalAssets,
        totalComplaints,
        pendingApprovals,
        totalDepartments,
        assetsByStatus,
        complaintsByStatus
      };
    } else if (req.user.role === 'department_head') {
      const departmentAssets = await Asset.countDocuments({ department: req.user.department });
      const departmentComplaints = await Complaint.countDocuments({ department: req.user.department });
      const pendingTechnicianApprovals = await User.countDocuments({
        role: 'technician',
        department: req.user.department,
        hodApproved: false
      });
      const technicians = await User.countDocuments({
        role: 'technician',
        department: req.user.department,
        adminApproved: true,
        hodApproved: true
      });

      stats = {
        departmentAssets,
        departmentComplaints,
        pendingTechnicianApprovals,
        technicians
      };
    } else if (req.user.role === 'technician') {
      const assignedAssets = await Asset.countDocuments({ assignedTechnician: req.user._id });
      const assignedComplaints = await Complaint.countDocuments({ assignedTo: req.user._id });
      const inProgressComplaints = await Complaint.countDocuments({
        assignedTo: req.user._id,
        status: { $in: ['Assigned', 'In Progress', 'Under Maintenance'] }
      });

      stats = {
        assignedAssets,
        assignedComplaints,
        inProgressComplaints
      };
    } else if (req.user.role === 'citizen') {
      const myComplaints = await Complaint.countDocuments({ citizen: req.user._id });
      const resolvedComplaints = await Complaint.countDocuments({
        citizen: req.user._id,
        status: 'Resolved'
      });
      const pendingComplaints = await Complaint.countDocuments({
        citizen: req.user._id,
        status: { $in: ['Submitted', 'Assigned', 'In Progress', 'Under Maintenance'] }
      });

      stats = {
        myComplaints,
        resolvedComplaints,
        pendingComplaints
      };
    }

    res.json(stats);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/dashboard/map-data
// @desc    Get map data (assets and complaints)
// @access  Private
router.get('/map-data', protect, async (req, res) => {
  try {
    let assetQuery = {};
    let complaintQuery = {};

    if (req.user.role === 'department_head') {
      assetQuery.department = req.user.department;
      complaintQuery.department = req.user.department;
    } else if (req.user.role === 'technician') {
      assetQuery.assignedTechnician = req.user._id;
      complaintQuery.assignedTo = req.user._id;
    } else if (req.user.role === 'citizen') {
      complaintQuery.citizen = req.user._id;
    }

    const assets = await Asset.find(assetQuery)
      .select('name category status location department assignedTechnician complaintCount')
      .populate('department', 'name')
      .populate('assignedTechnician', 'name');

    const complaints = await Complaint.find(complaintQuery)
      .select('title status location urgency asset')
      .populate('asset', 'name category');

    res.json({ assets, complaints });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;

