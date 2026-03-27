import mongoose from 'mongoose';

const assetSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  assetId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  category: {
    type: String,
    enum: ['Streetlights', 'Roads', 'Buildings', 'Water Pipelines', 'Public Utilities'],
    required: true
  },
  subcategory: {
    type: String,
    required: true,
    trim: true
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: true
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    },
    address: {
      type: String,
      required: true,
      trim: true
    }
  },
  status: {
    type: String,
    enum: ['Safe', 'Under Maintenance', 'Damaged', 'Recently Repaired', 'Critical'],
    default: 'Safe'
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Medium'
  },
  assignedTechnician: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  lastInspectionDate: {
    type: Date
  },
  nextInspectionDate: {
    type: Date
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  specifications: {
    manufacturer: String,
    model: String,
    yearInstalled: Number,
    expectedLifespan: Number, // in years
    warrantyExpiry: Date,
    material: String,
    dimensions: {
      height: Number,
      width: Number,
      depth: Number
    },
    weight: Number,
    capacity: String,
    operatingHours: Number,
    powerConsumption: Number
  },
  maintenance: {
    frequency: {
      type: String,
      enum: ['Daily', 'Weekly', 'Monthly', 'Quarterly', 'Annually', 'As Needed'],
      default: 'Monthly'
    },
    lastMaintenanceDate: Date,
    nextMaintenanceDate: Date,
    maintenanceHistory: [{
      date: Date,
      type: {
        type: String,
        enum: ['Inspection', 'Repair', 'Replacement', 'Preventive']
      },
      description: String,
      cost: Number,
      technician: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      photos: [String]
    }],
    totalMaintenanceCost: {
      type: Number,
      default: 0
    }
  },
  condition: {
    overall: {
      type: String,
      enum: ['Excellent', 'Good', 'Fair', 'Poor', 'Critical'],
      default: 'Good'
    },
    performance: {
      type: String,
      enum: ['Optimal', 'Good', 'Degraded', 'Poor', 'Failed'],
      default: 'Good'
    },
    safetyRating: {
      type: String,
      enum: ['A', 'B', 'C', 'D', 'F'],
      default: 'B'
    }
  },
  financial: {
    purchaseCost: Number,
    currentValue: Number,
    depreciationRate: Number,
    replacementCost: Number,
    annualOperatingCost: Number
  },
  documents: [{
    type: {
      type: String,
      enum: ['Manual', 'Warranty', 'Inspection', 'Maintenance', 'Photo', 'Other']
    },
    filename: String,
    url: String,
    uploadDate: Date
  }],
  complaintCount: {
    type: Number,
    default: 0
  },
  active: {
    type: Boolean,
    default: true
  },
  notes: {
    type: String,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Index for geospatial queries
assetSchema.index({ location: '2dsphere' });
assetSchema.index({ department: 1, createdAt: -1 });
assetSchema.index({ assignedTechnician: 1, createdAt: -1 });
assetSchema.index({ status: 1, priority: 1 });

export default mongoose.model('Asset', assetSchema);

