export type TimelineEvent = {
  id: string;
  type: 'doctor_entry' | 'student_update' | 'closed';
  date: string;
  note: string;
  author: string;
  isCritical?: boolean;
};

export type MedicalLog = {
  id: string;
  studentRegNo: string;
  studentName: string;
  illness: string;
  diagnosis: string;
  prescription: string;
  expectedDuration: string;
  status: 'active' | 'closed';
  timeline: TimelineEvent[];
};

export type LeaveStatus = 'applied' | 'doctor_verified' | 'proctor_approved' | 'rejected';

export type MedicalLeaveRequest = {
  id: string;
  studentRegNo: string;
  studentName: string;
  logId: string;
  reason: string;
  startDate: string;
  endDate: string;
  status: LeaveStatus;
  doctorNote?: string;
  proctorNote?: string;
  rejectionReason?: string;
  appliedDate: string;
};

export const medicalHistoryMock: { logs: MedicalLog[]; leaveRequests: MedicalLeaveRequest[] } = {
  logs: [
    {
      id: "LOG-2023-001",
      studentRegNo: "REG2021045",
      studentName: "Alex Johnson",
      illness: "Acute Gastroenteritis",
      diagnosis: "Foodborne viral infection causing stomach inflammation.",
      prescription: "Ondansetron 4mg SOS, ORS packets, Paracetamol 500mg for fever. Bland diet.",
      expectedDuration: "3-5 Days",
      status: "active",
      timeline: [
        {
          id: "EVT-1",
          type: "doctor_entry",
          date: "2023-10-24T09:30:00Z",
          note: "Patient presented with nausea and mild fever. Prescribed anti-emetics and hydration therapy.",
          author: "Dr. Sarah Smith"
        },
        {
          id: "EVT-2",
          type: "student_update",
          date: "2023-10-25T08:15:00Z",
          note: "Fever is gone, but still experiencing slight nausea after meals.",
          author: "Alex Johnson"
        }
      ]
    },
    {
      id: "LOG-2023-002",
      studentRegNo: "REG2022089",
      studentName: "Emily Davis",
      illness: "Suspected Jaundice",
      diagnosis: "Early signs of jaundice (yellowing eyes, fatigue). Pending LFT blood test results.",
      prescription: "Strict bed rest. High carb, low fat diet. Await lab results.",
      expectedDuration: "14 Days",
      status: "active",
      timeline: [
        {
          id: "EVT-3",
          type: "doctor_entry",
          date: "2023-10-22T14:00:00Z",
          note: "Initial examination shows scleral icterus. Ordered Liver Function Test.",
          author: "Dr. Michael Chen"
        },
        {
          id: "EVT-4",
          type: "student_update",
          date: "2023-10-24T10:00:00Z",
          note: "Condition worsening, feeling extremely fatigued and urine is very dark.",
          author: "Emily Davis",
          isCritical: true
        }
      ]
    },
    {
      id: "LOG-2023-003",
      studentRegNo: "REG2021045",
      studentName: "Alex Johnson",
      illness: "Sprained Ankle",
      diagnosis: "Grade 1 ligament sprain in right ankle.",
      prescription: "RICE protocol (Rest, Ice, Compression, Elevation). Ibuprofen 400mg BD.",
      expectedDuration: "7 Days",
      status: "closed",
      timeline: [
        {
          id: "EVT-5",
          type: "doctor_entry",
          date: "2023-08-10T11:00:00Z",
          note: "Sports injury. No fracture detected on X-Ray.",
          author: "Dr. Sarah Smith"
        },
        {
          id: "EVT-6",
          type: "student_update",
          date: "2023-08-14T09:00:00Z",
          note: "Swelling has reduced significantly. Can walk with minimal pain.",
          author: "Alex Johnson"
        },
        {
          id: "EVT-7",
          type: "closed",
          date: "2023-08-17T15:00:00Z",
          note: "Fully recovered. Resuming normal activities.",
          author: "Alex Johnson"
        }
      ]
    }
  ],
  leaveRequests: [
    {
      id: "LR-001",
      studentRegNo: "REG2021045",
      studentName: "Alex Johnson",
      logId: "LOG-2023-001",
      reason: "Severe gastroenteritis, advised bed rest.",
      startDate: "2023-10-24",
      endDate: "2023-10-28",
      status: "applied",
      appliedDate: "2023-10-24T10:00:00Z"
    },
    {
      id: "LR-002",
      studentRegNo: "REG2022089",
      studentName: "Emily Davis",
      logId: "LOG-2023-002",
      reason: "Suspected jaundice, requires isolation and rest.",
      startDate: "2023-10-22",
      endDate: "2023-11-05",
      status: "doctor_verified",
      doctorNote: "Medical legitimacy verified. Patient has visible symptoms of jaundice.",
      appliedDate: "2023-10-22T15:00:00Z"
    }
  ]
};
