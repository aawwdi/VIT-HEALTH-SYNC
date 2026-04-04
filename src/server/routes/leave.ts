import express from 'express';
import { protect, AuthRequest } from '../middleware/auth.ts';
import { HealthLog } from '../models/HealthLog.ts';

const router = express.Router();

// Student: Apply for leave
router.post('/apply/:logId', protect(['student']), async (req: AuthRequest, res) => {
  try {
    const { startDate, endDate, reason } = req.body;
    const log = await HealthLog.findById(req.params.logId);
    
    if (!log) return res.status(404).json({ message: 'Log not found' });
    if (log.studentId !== req.user.identifier) return res.status(403).json({ message: 'Not your log' });

    log.leaveStartDate = startDate;
    log.leaveEndDate = endDate;
    log.leaveReason = reason;
    log.leaveStatus = 'applied';

    await log.save();
    res.json(log);
  } catch (error) {
    console.error('Apply leave error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Doctor Only: Verify medical legitimacy
router.patch('/verify-doctor/:logId', protect(['doctor']), async (req: AuthRequest, res) => {
  try {
    const { action, note } = req.body; // action: 'approve' | 'reject'
    const log = await HealthLog.findById(req.params.logId);
    
    if (!log) return res.status(404).json({ message: 'Log not found' });

    if (action === 'approve') {
      log.doctorVerified = true;
      log.leaveStatus = 'doctor_verified';
      log.timeline.push({ type: 'doctor_entry', note: `Leave Verified: ${note || 'Medical legitimacy confirmed.'}`, author: req.user.name });
    } else {
      log.leaveStatus = 'rejected';
      log.rejectionReason = note;
      log.timeline.push({ type: 'doctor_entry', note: `Leave Rejected: ${note}`, author: req.user.name });
    }

    await log.save();
    res.json(log);
  } catch (error) {
    console.error('Verify leave error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Faculty Only: Grant final leave approval
router.patch('/approve-proctor/:logId', protect(['faculty']), async (req: AuthRequest, res) => {
  try {
    const { action, note } = req.body;
    const log = await HealthLog.findById(req.params.logId);
    
    if (!log) return res.status(404).json({ message: 'Log not found' });
    if (!log.doctorVerified && action === 'approve') {
      return res.status(400).json({ message: 'Cannot approve: Doctor has not verified this leave yet.' });
    }

    if (action === 'approve') {
      log.proctorApproved = true;
      log.leaveStatus = 'proctor_approved';
      log.timeline.push({ type: 'doctor_entry', note: `Leave Approved by Proctor: ${note || 'Academic leave granted.'}`, author: req.user.name });
    } else {
      log.leaveStatus = 'rejected';
      log.rejectionReason = note;
      log.timeline.push({ type: 'doctor_entry', note: `Leave Rejected by Proctor: ${note}`, author: req.user.name });
    }

    await log.save();
    res.json(log);
  } catch (error) {
    console.error('Approve leave error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
