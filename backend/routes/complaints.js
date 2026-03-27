import express from 'express';
import Complaint from '../models/Complaint.js';
import Asset from '../models/Asset.js';
import Department from '../models/Department.js';
import { protect, authorize } from '../middleware/auth.js';
import { upload } from '../config/multer.js';

const router = express.Router();

function toIdString(value) {
  if (!value) return null;
  if (typeof value === 'string') return value;
  if (value._id) return String(value._id);
  return String(value);
}

function parseLocation(body) {
  let loc = body.location;
  if (typeof loc === 'string') {
    try {
      loc = JSON.parse(loc);
    } catch {
      loc = null;
    }
  }

  const latitude =
    (loc && (loc.latitude ?? loc.lat)) ??
    (body.latitude ?? body.lat);
  const longitude =
    (loc && (loc.longitude ?? loc.lng)) ??
    (body.longitude ?? body.lng);

  const latNum = Number(latitude);
  const lngNum = Number(longitude);

  if (Number.isFinite(latNum) && Number.isFinite(lngNum)) {
    return { latitude: latNum, longitude: lngNum };
  }
  return null;
}

// @route   GET /api/complaints
// @desc    Get all complaints
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    let query = {};

    if (req.user.role === 'citizen') {
      query.citizen = req.user._id;
    }

    if (req.user.role === 'department_head') {
      const departmentId = toIdString(req.user.department);
      const departmentAssets = await Asset.find({ department: departmentId }).select('_id');
      const departmentAssetIds = departmentAssets.map((a) => a._id);

      // Include:
      // 1) complaints already mapped to this department
      // 2) legacy complaints missing department but linked to this department's assets
      query = {
        $or: [
          { department: departmentId },
          { department: { $exists: false }, asset: { $in: departmentAssetIds } },
          { department: null, asset: { $in: departmentAssetIds } }
        ]
      };
    }

    if (req.user.role === 'technician') {
      query.assignedTo = req.user._id;
    }

    const complaints = await Complaint.find(query)
      .populate('citizen', 'name email')
      .populate('asset', 'name category status department')
      .populate('department', 'name')
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 });

    let responseComplaints = complaints;

    // Final in-memory guard for department_head view in case some records have mixed id/object shapes.
    if (req.user.role === 'department_head') {
      const hodDepartmentId = toIdString(req.user.department);
      responseComplaints = complaints.filter((c) => {
        const complaintDepartmentId = toIdString(c.department);
        const assetDepartmentId = toIdString(c.asset?.department);
        return complaintDepartmentId === hodDepartmentId || (!complaintDepartmentId && assetDepartmentId === hodDepartmentId);
      });
    }

    // Auto-heal legacy complaints where department was not persisted.
    if (req.user.role === 'department_head') {
      const missingDepartmentIds = responseComplaints
        .filter((c) => !c.department && c.asset?.department)
        .map((c) => c._id);

      if (missingDepartmentIds.length > 0) {
        await Complaint.updateMany(
          { _id: { $in: missingDepartmentIds } },
          { $set: { department: req.user.department } }
        );
      }
    }

    res.json(responseComplaints);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/complaints/:id
// @desc    Get single complaint
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .populate('citizen', 'name email')
      .populate('asset', 'name category status department')
      .populate('department', 'name')
      .populate('assignedTo', 'name email')
      .populate('maintenanceLogs.technician', 'name email');

    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    if (req.user.role === 'citizen' && complaint.citizen.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (req.user.role === 'department_head') {
      const complaintDept = complaint.department?.toString();
      const hodDept = req.user.department?.toString();
      const complaintAssetDept = complaint.asset?.department?.toString();

      if (complaintDept && complaintDept !== hodDept) {
        return res.status(403).json({ message: 'Not authorized' });
      }

      // Allow legacy records that have missing complaint.department but asset department matches HOD.
      if (!complaintDept && complaintAssetDept && complaintAssetDept !== hodDept) {
        return res.status(403).json({ message: 'Not authorized' });
      }
    }

    if (req.user.role === 'technician' && complaint.assignedTo?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json(complaint);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/complaints
// @desc    Create complaint
// @access  Private/Citizen
router.post('/', protect, authorize('citizen'), upload.single('image'), async (req, res) => {
  try {
    const { title, description, category, asset, urgency, address, department: departmentFromBody } = req.body;
    const loc = parseLocation(req.body);
    if (!address || !String(address).trim()) {
      return res.status(400).json({ message: 'Address is required' });
    }
    if (!title || !String(title).trim()) {
      return res.status(400).json({ message: 'Title is required' });
    }
    if (!description || !String(description).trim()) {
      return res.status(400).json({ message: 'Description is required' });
    }

    let department = null;
    if (asset) {
      const assetDoc = await Asset.findById(asset);
      if (assetDoc) {
        department = assetDoc.department;
        assetDoc.complaintCount += 1;
        await assetDoc.save();
      }
    }

    // If complaint is not tied to an asset, allow citizen to pick department explicitly
    if (!department && departmentFromBody) {
      const dept = await Department.findById(departmentFromBody);
      if (!dept) {
        return res.status(400).json({ message: 'Selected department is invalid' });
      }
      department = dept._id;
    }

    if (!department) {
      return res.status(400).json({ message: 'Please select an asset or a department' });
    }

    const complaint = await Complaint.create({
      citizen: req.user._id,
      title,
      description,
      category: category || 'Maintenance',
      asset: asset || null,
      department,
      urgency: urgency || 'Medium',
      location: {
        type: 'Point',
        // Keep location mandatory in schema, but don't force citizens to know lat/lng.
        coordinates: loc ? [loc.longitude, loc.latitude] : [0, 0],
        address: String(address).trim()
      },
      image: req.file ? `/uploads/complaints/${req.file.filename}` : null
    });

    const populatedComplaint = await Complaint.findById(complaint._id)
      .populate('citizen', 'name email')
      .populate('asset', 'name category status')
      .populate('department', 'name');

    res.status(201).json(populatedComplaint);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/complaints/:id/assign
// @desc    Assign complaint to technician (with optional due date)
// @access  Private/Department Head or Admin
router.put('/:id/assign', protect, authorize('department_head', 'admin'), async (req, res) => {
  try {
    const { assignedTo, dueDate } = req.body;
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    if (req.user.role === 'department_head') {
      // Backfill old complaints that were created without department mapping
      if (!complaint.department) {
        complaint.department = req.user.department;
      } else if (complaint.department.toString() !== req.user.department.toString()) {
        return res.status(403).json({ message: 'Not authorized' });
      }
    }

    complaint.assignedTo = assignedTo;
    complaint.dueDate = dueDate ? new Date(dueDate) : undefined;
    complaint.status = 'Assigned';
    complaint.updatedAt = Date.now();

    await complaint.save();

    const populatedComplaint = await Complaint.findById(complaint._id)
      .populate('citizen', 'name email')
      .populate('asset', 'name category status')
      .populate('department', 'name')
      .populate('assignedTo', 'name email');

    res.json(populatedComplaint);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/complaints/:id/status
// @desc    Update complaint status
// @access  Private
router.put('/:id/status', protect, async (req, res) => {
  try {
    const { status } = req.body;
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    if (req.user.role === 'citizen' && complaint.citizen.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (req.user.role === 'technician' && complaint.assignedTo?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    complaint.status = status;
    complaint.updatedAt = new Date();

    await complaint.save();

    const populatedComplaint = await Complaint.findById(complaint._id)
      .populate('citizen', 'name email')
      .populate('asset', 'name category status')
      .populate('department', 'name')
      .populate('assignedTo', 'name email');

    res.json(populatedComplaint);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/complaints/:id/maintenance-log
// @desc    Add maintenance log
// @access  Private/Technician
router.post('/:id/maintenance-log', protect, authorize('technician'), upload.array('photos', 5), async (req, res) => {
  try {
    const { description, status } = req.body;
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    if (complaint.assignedTo?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const photos = req.files ? req.files.map(file => `/uploads/maintenance/${file.filename}`) : [];

    complaint.maintenanceLogs.push({
      technician: req.user._id,
      description,
      photos,
      status: status || complaint.status
    });

    if (status) {
      complaint.status = status;
    }

    complaint.updatedAt = new Date();
    await complaint.save();

    const populatedComplaint = await Complaint.findById(complaint._id)
      .populate('citizen', 'name email')
      .populate('asset', 'name category status')
      .populate('department', 'name')
      .populate('assignedTo', 'name email')
      .populate('maintenanceLogs.technician', 'name email');

    res.json(populatedComplaint);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;

