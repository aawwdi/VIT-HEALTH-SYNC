import mongoose from 'mongoose';

const timelineSchema = new mongoose.Schema({
  type: { type: String, enum: ['doctor_entry', 'student_update', 'closed'], required: true },
  date: { type: Date, default: Date.now },
  note: { type: String, required: true },
  author: { type: String, required: true },
  isCritical: { type: Boolean, default: false }
});

const healthLogSchema = new mongoose.Schema({
  studentId: { type: String, required: true }, // regNo
  studentName: { type: String, required: true },
  studentBlock: { type: String, default: 'Unknown' }, // hostel block
  illness: { type: String, required: true },
  diagnosis: { type: String },
  prescription: { type: String },
  expectedDuration: { type: String },
  status: { type: String, enum: ['active', 'closed'], default: 'active' },
  doctorVerified: { type: Boolean, default: false },
  proctorApproved: { type: Boolean, default: false },
  symptoms: [{ type: String }],
  timeline: [timelineSchema],
  verificationStatus: {
    type: String,
    enum: ['none', 'applied', 'doctor_verified', 'proctor_approved', 'rejected'],
    default: 'none'
  },
  // Leave request fields
  leaveStartDate: { type: Date },
  leaveEndDate: { type: Date },
  leaveReason: { type: String },
  leaveStatus: { type: String, enum: ['none', 'applied', 'doctor_verified', 'proctor_approved', 'rejected'], default: 'none' },
  rejectionReason: { type: String }
}, { timestamps: true });

// Keep verificationStatus in sync with leaveStatus
healthLogSchema.pre('save', async function () {
  this.verificationStatus = this.leaveStatus;
});

export const HealthLog = mongoose.model('HealthLog', healthLogSchema);
