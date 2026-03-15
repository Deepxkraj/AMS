import express from 'express';
import Complaint from '../models/Complaint.js';
import Asset from '../models/Asset.js';
import { protect, authorize } from '../middleware/auth.js';
import { upload } from '../config/multer.js';

const router = express.Router();

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
    
    // Citizen sees only their complaints
    if (req.user.role === 'citizen') {
      query.citizen = req.user._id;
    }
    
    // HOD sees complaints in their department
    if (req.user.role === 'hod') {
      query.department = req.user.department;
    }
    
    // Technician sees assigned complaints
    if (req.user.role === 'technician') {
      query.assignedTo = req.user._id;
    }

    const complaints = await Complaint.find(query)
      .populate('citizen', 'name email')
      .populate('asset', 'name category status')
      .populate('department', 'name')
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 });
    
    res.json(complaints);
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
      .populate('asset', 'name category status')
      .populate('department', 'name')
      .populate('assignedTo', 'name email')
      .populate('maintenanceLogs.technician', 'name email');
    
    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    // Check access permissions
    if (req.user.role === 'citizen' && complaint.citizen.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (req.user.role === 'hod' && complaint.department?.toString() !== req.user.department.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
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
    const { title, description, category, asset, urgency } = req.body;
    const loc = parseLocation(req.body);
    if (!loc) {
      return res.status(400).json({ message: 'Valid location (latitude/longitude) is required' });
    }

    let department = null;
    if (asset) {
      const assetDoc = await Asset.findById(asset);
      if (assetDoc) {
        department = assetDoc.department;
        // Increment complaint count
        assetDoc.complaintCount += 1;
        await assetDoc.save();
      }
    }

    const complaint = await Complaint.create({
      citizen: req.user._id,
      title,
      description,
      category,
      asset: asset || null,
      department,
      urgency: urgency || 'Medium',
      location: {
        type: 'Point',
        coordinates: [loc.longitude, loc.latitude]
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
// @access  Private/HOD or Admin
router.put('/:id/assign', protect, authorize('hod', 'admin'), async (req, res) => {
  try {
    const { assignedTo, dueDate } = req.body;
    const complaint = await Complaint.findById(req.params.id);
    
    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    // HOD can only assign complaints in their department
    if (req.user.role === 'hod' && complaint.department?.toString() !== req.user.department.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
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

    // Check permissions
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

