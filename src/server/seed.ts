import bcrypt from 'bcryptjs';
import { User } from './models/User.ts';
import { HealthLog } from './models/HealthLog.ts';

export const seedDatabase = async () => {
  try {
    const userCount = await User.countDocuments();
    if (userCount > 0) {
      console.log('Database already seeded.');
      return;
    }

    console.log('Seeding database with test identities...');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('12345', salt);

    // ─── PROCTORS / FACULTY ───────────────────────────────────────────────
    await User.create({ name: 'Prof. Sandeep Moonga',  role: 'faculty', empId: '26BCE4078', password: hashedPassword });
    await User.create({ name: 'Prof. Ramesh Kumar',    role: 'faculty', empId: '26BCE4080', password: hashedPassword });
    await User.create({ name: 'Prof. Meena Pillai',    role: 'faculty', empId: '26BCE4082', password: hashedPassword });

    // ─── DOCTOR ──────────────────────────────────────────────────────────
    await User.create({ name: 'Dr. Gauri Nandwana', role: 'doctor', empId: '24BCE10245', password: hashedPassword });

    // ─── STUDENTS & PARENTS ──────────────────────────────────────────────
    // 1. Aditya Singh
    await User.create({
      name: 'Aditya Singh', role: 'student',
      regNo: '24BCE10249', block: 'Block-1',
      dob: '2006-12-24', assignedProctor: '26BCE4078',
      password: hashedPassword
    });
    await User.create({
      name: 'Neha Garg', role: 'parent',
      email: 'gargn3250@gmail.com',
      linkedStudent: '24BCE10249',
      password: hashedPassword
    });

    // 2. Riya Kapoor (NEW)
    await User.create({
      name: 'Riya Kapoor', role: 'student',
      regNo: '24BCE10301', block: 'Block-1',
      dob: '2007-03-15', assignedProctor: '26BCE4078',
      password: hashedPassword
    });
    await User.create({
      name: 'Sunita Kapoor', role: 'parent',
      email: 'kapoor.riya.parent@gmail.com',
      linkedStudent: '24BCE10301',
      password: hashedPassword
    });

    // 3. Karan Mehta (NEW)
    await User.create({
      name: 'Karan Mehta', role: 'student',
      regNo: '24BCE10312', block: 'Block-1',
      dob: '2006-07-08', assignedProctor: '26BCE4080',
      password: hashedPassword
    });
    await User.create({
      name: 'Vikas Mehta', role: 'parent',
      email: 'mehta.karan.parent@gmail.com',
      linkedStudent: '24BCE10312',
      password: hashedPassword
    });

    // 4. Ishita Sharma (NEW)
    await User.create({
      name: 'Ishita Sharma', role: 'student',
      regNo: '24BCE10323', block: 'Block-2',
      dob: '2007-09-22', assignedProctor: '26BCE4080',
      password: hashedPassword
    });
    await User.create({
      name: 'Priya Sharma', role: 'parent',
      email: 'sharma.ishita.parent@gmail.com',
      linkedStudent: '24BCE10323',
      password: hashedPassword
    });

    // 5. Dev Patel (NEW)
    await User.create({
      name: 'Dev Patel', role: 'student',
      regNo: '24BCE10334', block: 'Block-2',
      dob: '2007-01-11', assignedProctor: '26BCE4082',
      password: hashedPassword
    });
    await User.create({
      name: 'Ramesh Patel', role: 'parent',
      email: 'patel.dev.parent@gmail.com',
      linkedStudent: '24BCE10334',
      password: hashedPassword
    });

    // 6. Shreya Nair (NEW)
    await User.create({
      name: 'Shreya Nair', role: 'student',
      regNo: '24BCE10345', block: 'Block-3',
      dob: '2006-05-30', assignedProctor: '26BCE4082',
      password: hashedPassword
    });
    await User.create({
      name: 'Meera Nair', role: 'parent',
      email: 'nair.shreya.parent@gmail.com',
      linkedStudent: '24BCE10345',
      password: hashedPassword
    });

    // ─── HEALTH LOGS ─────────────────────────────────────────────────────
    const daysAgo = (n: number) => {
      const d = new Date();
      d.setDate(d.getDate() - n);
      return d;
    };

    // Jaundice outbreak in Block-1 (3 cases → triggers alert)
    await HealthLog.create({
      studentId: '24BCE10249', studentName: 'Aditya Singh', studentBlock: 'Block-1',
      illness: 'Jaundice',
      diagnosis: 'Yellow sclera, nausea, fatigue. Bilirubin elevated.',
      prescription: 'Avoid fatty foods, bed rest, oral hydration.',
      expectedDuration: '1-2 Weeks', status: 'active',
      symptoms: ['Yellowing Eyes', 'Nausea', 'Fatigue'],
      verificationStatus: 'applied', leaveStatus: 'applied',
      leaveStartDate: daysAgo(1), leaveEndDate: daysAgo(-5),
      leaveReason: 'Jaundice — needs complete bed rest.',
      createdAt: daysAgo(2),
      timeline: [{ type: 'doctor_entry', date: daysAgo(2), note: 'Patient presented with yellowing eyes. Bilirubin elevated. Rest advised.', author: 'Dr. Gauri Nandwana' }]
    });

    await HealthLog.create({
      studentId: '24BCE10301', studentName: 'Riya Kapoor', studentBlock: 'Block-1',
      illness: 'Jaundice',
      diagnosis: 'Mild jaundice. Liver function test elevated.',
      prescription: 'Bed rest, fluids, Liv-52.',
      expectedDuration: '1-2 Weeks', status: 'active',
      symptoms: ['Yellowing Skin', 'Nausea', 'Loss of Appetite'],
      verificationStatus: 'none', leaveStatus: 'none',
      createdAt: daysAgo(3),
      timeline: [{ type: 'doctor_entry', date: daysAgo(3), note: 'Diagnosed with jaundice. Referred for LFT.', author: 'Dr. Gauri Nandwana' }]
    });

    await HealthLog.create({
      studentId: '24BCE10312', studentName: 'Karan Mehta', studentBlock: 'Block-1',
      illness: 'Jaundice',
      diagnosis: 'Hepatitis A suspected. Urine dark coloured.',
      prescription: 'IV fluids, complete rest, no solid food for 48h.',
      expectedDuration: '1 Month+', status: 'active',
      symptoms: ['Dark Urine', 'Yellowing Eyes', 'High Fever'],
      verificationStatus: 'doctor_verified', leaveStatus: 'doctor_verified',
      doctorVerified: true,
      leaveStartDate: daysAgo(1), leaveEndDate: daysAgo(-14),
      leaveReason: 'Suspected Hepatitis A — extended leave required.',
      createdAt: daysAgo(1),
      timeline: [
        { type: 'doctor_entry', date: daysAgo(1), note: 'High fever + dark urine. Hepatitis A suspected.', author: 'Dr. Gauri Nandwana' },
        { type: 'doctor_entry', date: daysAgo(0), note: 'Leave Verified: Medical legitimacy confirmed.', author: 'Dr. Gauri Nandwana' }
      ]
    });

    await HealthLog.create({
      studentId: '24BCE10323', studentName: 'Ishita Sharma', studentBlock: 'Block-2',
      illness: 'Viral Fever',
      diagnosis: 'High temperature 102F, body ache.',
      prescription: 'Paracetamol 500mg, rest 3 days.',
      expectedDuration: '1-3 Days', status: 'closed',
      symptoms: ['Fever', 'Body Ache'],
      verificationStatus: 'proctor_approved', leaveStatus: 'proctor_approved',
      doctorVerified: true, proctorApproved: true,
      leaveStartDate: daysAgo(5), leaveEndDate: daysAgo(2),
      leaveReason: 'Viral fever — needs rest.',
      createdAt: daysAgo(6),
      timeline: [
        { type: 'doctor_entry', date: daysAgo(6), note: 'Patient presented with 102F fever. Prescribed rest.', author: 'Dr. Gauri Nandwana' },
        { type: 'doctor_entry', date: daysAgo(5), note: 'Leave Verified: Medical legitimacy confirmed.', author: 'Dr. Gauri Nandwana' },
        { type: 'doctor_entry', date: daysAgo(4), note: 'Leave Approved by Proctor: Academic leave granted.', author: 'Prof. Sandeep Moonga' },
        { type: 'closed', date: daysAgo(2), note: 'Student recovered and returned to campus.', author: 'Ishita Sharma' }
      ]
    });

    await HealthLog.create({
      studentId: '24BCE10334', studentName: 'Dev Patel', studentBlock: 'Block-2',
      illness: 'Viral Fever',
      diagnosis: 'Mild fever 100F, sore throat.',
      prescription: 'Crocin 650mg, warm water gargle.',
      expectedDuration: '1-3 Days', status: 'active',
      symptoms: ['Fever', 'Sore Throat'],
      verificationStatus: 'none', leaveStatus: 'none',
      createdAt: daysAgo(1),
      timeline: [{ type: 'doctor_entry', date: daysAgo(1), note: 'Mild fever and throat infection. Rest advised.', author: 'Dr. Gauri Nandwana' }]
    });

    await HealthLog.create({
      studentId: '24BCE10345', studentName: 'Shreya Nair', studentBlock: 'Block-3',
      illness: 'Migraine',
      diagnosis: 'Severe recurring headache, light sensitivity.',
      prescription: 'Sumatriptan 50mg, dark room rest, avoid screens.',
      expectedDuration: '3-7 Days', status: 'active',
      symptoms: ['Headache', 'Light Sensitivity', 'Nausea'],
      verificationStatus: 'applied', leaveStatus: 'applied',
      leaveStartDate: daysAgo(0), leaveEndDate: daysAgo(-3),
      leaveReason: 'Severe migraine — cannot attend classes.',
      createdAt: daysAgo(2),
      timeline: [
        { type: 'doctor_entry', date: daysAgo(2), note: 'Chronic migraine episode. Advised complete rest and screen avoidance.', author: 'Dr. Gauri Nandwana' },
        { type: 'student_update', date: daysAgo(1), note: 'Still experiencing pain and nausea.', author: 'Shreya Nair', isCritical: true }
      ]
    });

    console.log('Database seeded successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
};
