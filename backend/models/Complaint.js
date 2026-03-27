import mongoose from 'mongoose';

const complaintSchema = new mongoose.Schema({
  citizen: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  asset: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Asset'
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    enum: ['Damage', 'Maintenance', 'Safety', 'Other'],
    required: true
  },
  image: {
    type: String
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
  urgency: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Medium'
  },
  status: {
    type: String,
    enum: ['Submitted', 'Assigned', 'In Progress', 'Under Maintenance', 'Resolved'],
    default: 'Submitted'
  },
  dueDate: {
    type: Date
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department'
  },
  maintenanceLogs: [{
    technician: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    description: String,
    photos: [String],
    status: String,
    date: {
      type: Date,
      default: Date.now
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

complaintSchema.index({ location: '2dsphere' });
complaintSchema.index({ department: 1, createdAt: -1 });
complaintSchema.index({ assignedTo: 1, status: 1, createdAt: -1 });
complaintSchema.index({ citizen: 1, createdAt: -1 });
complaintSchema.index({ status: 1, dueDate: 1 });

export default mongoose.model('Complaint', complaintSchema);

