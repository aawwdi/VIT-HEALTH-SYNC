import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import Navigation from './components/Navigation';
import StudentDashboard from './components/StudentDashboard';
import DoctorDashboard from './components/DoctorDashboard';
import FacultyDashboard from './components/FacultyDashboard';
import ParentDashboard from './components/ParentDashboard';
import LoginComponents from './components/LoginComponents';

export default function App() {
  const [userRole, setUserRole] = useState<string | null>(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        return user.role;
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  return (
    <Router>
      <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
        <Toaster position="top-right" richColors />
        <Navigation userRole={userRole} setUserRole={setUserRole} />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Routes>
            <Route path="/" element={<Navigate to={userRole ? `/${userRole}` : "/login"} replace />} />
            <Route path="/login" element={userRole ? <Navigate to={`/${userRole}`} replace /> : <LoginComponents onLogin={setUserRole} />} />
            <Route path="/student" element={userRole === 'student' ? <StudentDashboard /> : <Navigate to="/login" replace />} />
            <Route path="/doctor"  element={userRole === 'doctor'  ? <DoctorDashboard />  : <Navigate to="/login" replace />} />
            <Route path="/parent"  element={userRole === 'parent'  ? <ParentDashboard />  : <Navigate to="/login" replace />} />
            <Route path="/faculty" element={userRole === 'faculty' ? <FacultyDashboard /> : <Navigate to="/login" replace />} />
            <Route path="*" element={<Navigate to={userRole ? `/${userRole}` : "/login"} replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
