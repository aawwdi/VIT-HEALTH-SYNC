import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.ts';
import { protect, AuthRequest } from '../middleware/auth.ts';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_for_dev';

// Standard login (student, doctor, faculty)
router.post('/login', async (req, res) => {
  try {
    const { identifier, password, role } = req.body;

    let query: any = { role };
    if (role === 'student') query.regNo = identifier;
    else if (role === 'doctor' || role === 'faculty') query.empId = identifier;
    else if (role === 'parent') query.email = identifier;

    const user = await User.findOne(query);
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign(
      { id: user._id, role: user.role, name: user.name, identifier },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({ token, user: { id: user._id, name: user.name, role: user.role, identifier } });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Parent login: requires Student Reg No + Parent Email + Student DOB
router.post('/parent-login', async (req, res) => {
  try {
    const { regNo, email, dob } = req.body; // dob as YYYY-MM-DD

    if (!regNo || !email || !dob) {
      return res.status(400).json({ message: 'Reg No, Email, and Student DOB are required.' });
    }

    // Find the student and check DOB
    const student = await User.findOne({ role: 'student', regNo });
    if (!student) {
      return res.status(401).json({ message: 'No student found with this Registration Number.' });
    }
    if (student.dob !== dob) {
      return res.status(401).json({ message: 'Student Date of Birth does not match.' });
    }

    // Find the parent record by email and verify it is linked to this student
    const parent = await User.findOne({ role: 'parent', email, linkedStudent: regNo });
    if (!parent) {
      return res.status(401).json({ message: 'Parent email is not registered for this student.' });
    }

    const token = jwt.sign(
      { id: parent._id, role: 'parent', name: parent.name, identifier: email, linkedStudent: regNo },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({
      token,
      user: {
        id: parent._id,
        name: parent.name,
        role: 'parent',
        identifier: email,
        linkedStudent: regNo,
        studentName: student.name
      }
    });
  } catch (error) {
    console.error('Parent login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Doctor Only: Look up a student by Registration Number for auto-fill
router.get('/student/:regNo', protect(['doctor']), async (req: AuthRequest, res) => {
  try {
    const student = await User.findOne({ role: 'student', regNo: req.params.regNo });
    if (!student) return res.status(404).json({ message: 'Student not found' });
    res.json({ name: student.name, regNo: student.regNo, block: student.block || 'Unknown' });
  } catch (error) {
    console.error('Student lookup error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
