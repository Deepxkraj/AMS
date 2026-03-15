import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Department from './models/Department.js';

import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import assetRoutes from './routes/assets.js';
import complaintRoutes from './routes/complaints.js';
import departmentRoutes from './routes/departments.js';
import approvalRoutes from './routes/approvals.js';
import dashboardRoutes from './routes/dashboard.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

async function ensureDefaultDepartments() {
  const defaults = [
    { name: 'Electrical', description: 'Streetlights, power-related public infrastructure' },
    { name: 'Roads', description: 'Roads, footpaths, traffic-related assets' },
    { name: 'Water', description: 'Water pipelines, valves, water supply assets' },
    { name: 'Buildings', description: 'Public buildings, structural maintenance' },
    { name: 'Public Utilities', description: 'Other municipal public utilities' },
  ];

  for (const d of defaults) {
    await Department.updateOne(
      { name: d.name },
      { $setOnInsert: { name: d.name, description: d.description } },
      { upsert: true }
    );
  }
}

mongoose
  .connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ams_db')
  .then(async () => {
    console.log('MongoDB connected');
    await ensureDefaultDepartments();
  })
  .catch((err) => console.error('MongoDB connection error:', err));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/approvals', approvalRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

app.use((err, req, res, next) => {
  if (!err) return next();

  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ message: 'File too large. Max allowed size is 15MB.' });
  }

  if (err.message && (err.message.includes('Only image files') || err.message.includes('Only image'))) {
    return res.status(400).json({ message: err.message });
  }

  console.error(err);
  return res.status(500).json({ message: 'Server error' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error"
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
app.get("/api", (req, res) => {
  res.send("API working");
});

