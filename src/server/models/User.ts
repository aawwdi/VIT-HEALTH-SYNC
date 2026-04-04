import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  role: { type: String, enum: ['student', 'doctor', 'faculty', 'parent'], required: true },
  password: { type: String, required: true },
  // Student-specific
  regNo: { type: String, unique: true, sparse: true },
  block: { type: String },
  dob: { type: String }, // stored as YYYY-MM-DD e.g. "2006-12-24"
  assignedProctor: { type: String }, // Faculty empId
  // Doctor/Faculty
  empId: { type: String, unique: true, sparse: true },
  // Parent
  email: { type: String, unique: true, sparse: true },
  linkedStudent: { type: String } // stores student regNo
}, { timestamps: true });

export const User = mongoose.model('User', userSchema);
