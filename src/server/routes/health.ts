import express from 'express';
import { protect, AuthRequest } from '../middleware/auth.ts';
import { HealthLog } from '../models/HealthLog.ts';
import { OutbreakAck } from '../models/OutbreakAck.ts';

const router = express.Router();

// Doctor Only: Create new health log
router.post('/create', protect(['doctor']), async (req: AuthRequest, res) => {
  try {
    const { studentId, studentName, studentBlock, illness, diagnosis, prescription, expectedDuration, symptoms } = req.body;
    const newLog = new HealthLog({
      studentId, studentName,
      studentBlock: studentBlock || 'Unknown',
      illness, diagnosis, prescription, expectedDuration, symptoms,
      status: 'active', verificationStatus: 'none',
      timeline: [{ type: 'doctor_entry', note: `Initial Diagnosis: ${diagnosis}. Prescription: ${prescription}`, author: req.user.name }]
    });
    await newLog.save();
    res.status(201).json(newLog);
  } catch (error) {
    console.error('Create log error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Student Only: Update or close log
router.patch('/update/:id', protect(['student']), async (req: AuthRequest, res) => {
  try {
    const { note, isCritical, closeLog } = req.body;
    const log = await HealthLog.findById(req.params.id);
    if (!log) return res.status(404).json({ message: 'Log not found' });
    if (log.studentId !== req.user.identifier) return res.status(403).json({ message: 'Not your log' });
    log.timeline.push({ type: closeLog ? 'closed' : 'student_update', note, author: req.user.name, isCritical: isCritical || false });
    if (closeLog) log.status = 'closed';
    await log.save();
    res.json(log);
  } catch (error) {
    console.error('Update log error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get logs
router.get('/', protect(), async (req: AuthRequest, res) => {
  try {
    let logs;
    if (req.user.role === 'student') {
      logs = await HealthLog.find({ studentId: req.user.identifier }).sort({ createdAt: -1 });
    } else if (req.user.role === 'parent') {
      const linkedStudent = req.user.linkedStudent;
      logs = linkedStudent
        ? await HealthLog.find({ studentId: linkedStudent }).sort({ createdAt: -1 })
        : [];
    } else {
      logs = await HealthLog.find().sort({ createdAt: -1 });
    }
    res.json(logs);
  } catch (error) {
    console.error('Get logs error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Doctor Only: Outbreak trend analysis for the last 7 days
router.get('/analytics/outbreak', protect(['doctor', 'parent']), async (req: AuthRequest, res) => {
  try {
    const THRESHOLD = 3;
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentLogs = await HealthLog.find({ createdAt: { $gte: sevenDaysAgo } }).sort({ createdAt: 1 });

    const dateMap: Record<string, Record<string, number>> = {};
    const illnessTotals: Record<string, number> = {};
    const blockIllnessMap: Record<string, Record<string, number>> = {};

    recentLogs.forEach(log => {
      const dateKey = new Date(log.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const illness = log.illness.toLowerCase();

      if (!dateMap[dateKey]) dateMap[dateKey] = {};
      dateMap[dateKey][illness] = (dateMap[dateKey][illness] || 0) + 1;

      illnessTotals[illness] = (illnessTotals[illness] || 0) + 1;

      const block = log.studentBlock || 'Unknown';
      if (!blockIllnessMap[block]) blockIllnessMap[block] = {};
      blockIllnessMap[block][illness] = (blockIllnessMap[block][illness] || 0) + 1;
    });

    const chartData = Object.entries(dateMap).map(([date, illnesses]) => ({ date, ...illnesses }));

    // Fetch recent acknowledgments (last 7 days)
    const recentAcks = await OutbreakAck.find({ acknowledgedAt: { $gte: sevenDaysAgo } });
    const ackedKeys = new Set(recentAcks.map(a => `${a.illness}__${a.block}`));

    const alerts: { block: string; illness: string; count: number; severity: string; acknowledged: boolean; acknowledgedAt?: Date; acknowledgedBy?: string }[] = [];
    Object.entries(blockIllnessMap).forEach(([block, illnesses]) => {
      Object.entries(illnesses).forEach(([illness, count]) => {
        if (count >= THRESHOLD) {
          const key = `${illness}__${block}`;
          const ack = recentAcks.find(a => a.illness === illness && a.block === block);
          alerts.push({
            block, illness, count,
            severity: count >= THRESHOLD * 2 ? 'critical' : 'warning',
            acknowledged: ackedKeys.has(key),
            acknowledgedAt: ack?.acknowledgedAt,
            acknowledgedBy: ack?.acknowledgedBy
          });
        }
      });
    });

    res.json({ chartData, illnessTotals, blockIllnessMap, alerts, threshold: THRESHOLD });
  } catch (error) {
    console.error('Outbreak analytics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Doctor Only: Acknowledge an outbreak alert
router.post('/analytics/acknowledge-outbreak', protect(['doctor']), async (req: AuthRequest, res) => {
  try {
    const { illness, block, note } = req.body;
    if (!illness || !block) return res.status(400).json({ message: 'illness and block are required' });

    // Remove any existing ack for this illness+block combo (replace with new one)
    await OutbreakAck.deleteMany({ illness, block });

    const ack = new OutbreakAck({
      illness,
      block,
      acknowledgedAt: new Date(),
      acknowledgedBy: req.user.name,
      note: note || 'Alert acknowledged and situation under control.'
    });
    await ack.save();

    res.json({ success: true, ack });
  } catch (error) {
    console.error('Acknowledge outbreak error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
