import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['admin', 'department_head', 'technician', 'citizen'],
    required: true
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: function() {
      return this.role === 'department_head' || this.role === 'technician';
    }
  },
  phone: {
    type: String,
    required: function() {
      return this.role === 'department_head' || this.role === 'technician';
    }
  },
  idProof: {
    type: String, // Path to uploaded file
    required: function() {
      return this.role === 'department_head' || this.role === 'technician';
    }
  },
  adminApproved: {
    type: Boolean,
    default: function() {
      return this.role === 'admin' || this.role === 'citizen';
    }
  },
  hodApproved: {
    type: Boolean,
    default: function() {
      return this.role === 'admin' || this.role === 'citizen' || this.role === 'department_head';
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model('User', userSchema);

