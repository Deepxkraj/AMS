import express from 'express';
import Asset from '../models/Asset.js';
import User from '../models/User.js';
import { protect, authorize } from '../middleware/auth.js';
import { upload } from '../config/multer.js';

const router = express.Router();

function parseLocation(body) {
  // Accept:
  // - body.location as object: { latitude, longitude } or { lat, lng }
  // - body.location as JSON string
  // - body.latitude/body.longitude as strings (FormData)
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

// @route   GET /api/assets
// @desc    Get all assets
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    let query = {};
    const includeMaintenance = req.query.includeMaintenance === '1';
    const includeDepartmentHOD = req.query.includeDepartmentHOD === '1';
    
    // Department Head sees only their department assets
    if (req.user.role === 'department_head') {
      query.department = req.user.department;
    }
    
    // Technician sees only assigned assets
    if (req.user.role === 'technician') {
      query.assignedTechnician = req.user._id;
    }

    let assetQuery = Asset.find(query)
      .select(includeMaintenance ? undefined : '-maintenance.maintenanceHistory')
      .populate({
        path: 'department',
        select: 'name',
        strictPopulate: false
      })
      .populate({
        path: 'assignedTechnician',
        select: 'name email',
        strictPopulate: false
      })
      .sort({ createdAt: -1 });

    if (includeMaintenance) {
      assetQuery = assetQuery.populate({
        path: 'maintenance.maintenanceHistory.technician',
        select: 'name email',
        strictPopulate: false
      });
    }

    const assets = await assetQuery.lean();

    if (!includeDepartmentHOD) {
      return res.json(assets);
    }

    const departments = [...new Set(assets.map((asset) => asset.department?._id).filter(Boolean))];
    const departmentHeads = await User.find({
      role: 'department_head',
      department: { $in: departments },
      isActive: true
    }).select('name email department').lean();

    const hodMap = {};
    departmentHeads.forEach((hod) => {
      hodMap[String(hod.department)] = hod;
    });

    const assetsWithHOD = assets.map((asset) => ({
      ...asset,
      departmentHOD: hodMap[String(asset.department?._id)] || null
    }));

    res.json(assetsWithHOD);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/assets/:id
// @desc    Get single asset
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.id)
      .populate({
        path: 'department',
        select: 'name',
        strictPopulate: false
      })
      .populate({
        path: 'assignedTechnician',
        select: 'name email',
        strictPopulate: false
      });
    
    if (!asset) {
      return res.status(404).json({ message: 'Asset not found' });
    }

    // Check access permissions
    if (req.user.role === 'department_head' && asset.department.toString() !== req.user.department.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (req.user.role === 'technician' && asset.assignedTechnician?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json(asset);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/assets
// @desc    Create asset with full details
// @access  Private/Admin or Department Head
router.post('/', protect, authorize('admin', 'department_head'), async (req, res) => {
  try {
    const {
      name,
      assetId,
      category,
      subcategory,
      department,
      description,
      status,
      priority,
      condition,
      specifications,
      financial,
      maintenance,
      assignedTechnician,
      lastInspectionDate,
      nextInspectionDate,
      notes
    } = req.body;

    const loc = parseLocation(req.body);
    if (!loc) {
      return res.status(400).json({ message: 'Valid location (latitude/longitude) is required' });
    }

    const address =
      req.body.location?.address ??
      req.body.address;
    if (!address || typeof address !== 'string' || !address.trim()) {
      return res.status(400).json({ message: 'Asset address is required' });
    }

    if (!assetId || !String(assetId).trim()) {
      return res.status(400).json({ message: 'Asset ID is required' });
    }

    if (!subcategory || !String(subcategory).trim()) {
      return res.status(400).json({ message: 'Subcategory is required' });
    }

    // Department Head can only create assets in their department
    if (req.user.role === 'department_head') {
      if (department !== req.user.department.toString()) {
        return res.status(403).json({ message: 'Not authorized to create asset in this department' });
      }
    }

    const asset = await Asset.create({
      name,
      assetId,
      category,
      subcategory,
      department,
      status,
      priority,
      condition,
      specifications,
      financial,
      maintenance,
      assignedTechnician,
      lastInspectionDate,
      nextInspectionDate,
      notes,
      location: {
        type: 'Point',
        coordinates: [loc.longitude, loc.latitude],
        address: address.trim()
      },
      description
    });

    const populatedAsset = await Asset.findById(asset._id)
      .populate({
        path: 'department',
        select: 'name',
        strictPopulate: false
      })
      .populate({
        path: 'assignedTechnician',
        select: 'name email',
        strictPopulate: false
      });

    res.status(201).json(populatedAsset);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/assets/:id
// @desc    Update asset (status, technician, inspection dates)
// @access  Private/Admin or Department Head or assigned Technician (limited)
router.put('/:id', protect, authorize('admin', 'department_head', 'technician'), async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.id);
    
    if (!asset) {
      return res.status(404).json({ message: 'Asset not found' });
    }

    // Check permissions
    if (req.user.role === 'department_head' && asset.department.toString() !== req.user.department.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (req.user.role === 'technician' && asset.assignedTechnician?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { name, category, status, description, assignedTechnician, lastInspectionDate, nextInspectionDate } = req.body;

    if (name) asset.name = name;
    if (category) asset.category = category;
    if (status) asset.status = status;
    if (description !== undefined) asset.description = description;
    if (assignedTechnician !== undefined && (req.user.role === 'admin' || req.user.role === 'department_head')) {
      asset.assignedTechnician = assignedTechnician;
    }
    if (lastInspectionDate) asset.lastInspectionDate = lastInspectionDate;
    if (nextInspectionDate && (req.user.role === 'admin' || req.user.role === 'department_head')) {
      asset.nextInspectionDate = nextInspectionDate;
    }
    
    asset.updatedAt = new Date();

    await asset.save();

    const populatedAsset = await Asset.findById(asset._id)
      .populate({
        path: 'department',
        select: 'name',
        strictPopulate: false
      })
      .populate({
        path: 'assignedTechnician',
        select: 'name email',
        strictPopulate: false
      });

    res.json(populatedAsset);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/assets/:id
// @desc    Delete asset
// @access  Private/Admin
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.id);
    
    if (!asset) {
      return res.status(404).json({ message: 'Asset not found' });
    }

    await asset.deleteOne();
    res.json({ message: 'Asset deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/assets/:id/maintenance-log
// @desc    Add maintenance log for asset (technician proof)
// @access  Private/Technician
router.post('/:id/maintenance-log', protect, authorize('technician'), upload.array('photos', 5), async (req, res) => {
  try {
    const { description, type, cost } = req.body;
    const asset = await Asset.findById(req.params.id);

    if (!asset) {
      return res.status(404).json({ message: 'Asset not found' });
    }

    if (asset.assignedTechnician?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to add maintenance log for this asset' });
    }

    const photos = req.files ? req.files.map(file => `/uploads/maintenance/${file.filename}`) : [];

    const logEntry = {
      date: new Date(),
      type: type || 'Repair',
      description,
      technician: req.user._id,
      photos
    };

    if (cost !== undefined) {
      const numCost = Number(cost);
      if (Number.isFinite(numCost)) {
        logEntry.cost = numCost;
        asset.maintenance.totalMaintenanceCost = (asset.maintenance.totalMaintenanceCost || 0) + numCost;
      }
    }

    asset.maintenance.maintenanceHistory.push(logEntry);
    asset.maintenance.lastMaintenanceDate = new Date();
    asset.updatedAt = new Date();

    await asset.save();

    const populated = await Asset.findById(asset._id)
      .populate('department', 'name')
      .populate('assignedTechnician', 'name email')
      .populate('maintenance.maintenanceHistory.technician', 'name email');

    res.json(populated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;

