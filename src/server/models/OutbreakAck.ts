import mongoose from 'mongoose';

const outbreakAckSchema = new mongoose.Schema({
  illness: { type: String, required: true },
  block: { type: String, required: true },
  acknowledgedAt: { type: Date, default: Date.now },
  acknowledgedBy: { type: String, required: true },
  note: { type: String }
}, { timestamps: true });

export const OutbreakAck = mongoose.model('OutbreakAck', outbreakAckSchema);
