import React, { useState } from 'react';
import { User, Lock, Mail, Calendar, Stethoscope, GraduationCap, Users, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface LoginProps {
  onLogin: (role: string) => void;
}

export default function LoginComponents({ onLogin }: LoginProps) {
  const [activeTab, setActiveTab] = useState<'student' | 'doctor' | 'parent' | 'faculty'>('student');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent, role: string) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const inputs = form.querySelectorAll('input');

    try {
      let response: Response;

      if (role === 'parent') {
        // Parent login: regNo + email + dob (dob acts as the authentication key)
        const regNo     = (inputs[0] as HTMLInputElement).value.trim().toUpperCase();
        const email     = (inputs[1] as HTMLInputElement).value.trim();
        const dob       = (inputs[2] as HTMLInputElement).value; // YYYY-MM-DD from date input

        response = await fetch('/api/auth/parent-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ regNo, email, dob })
        });
      } else {
        const identifier = (inputs[0] as HTMLInputElement).value.trim();
        const password   = (inputs[1] as HTMLInputElement).value;

        response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identifier, password, role })
        });
      }

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Incorrect credentials. Please try again.');

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      onLogin(role);
      toast.success(`Successfully logged in as ${role}!`);
      navigate(`/${role}`);
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error(error.message || 'Failed to login. Please check your credentials.');
    }
  };

  const tabCls = (tab: string) =>
    `flex-1 flex items-center justify-center py-2 px-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
      activeTab === tab ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
    }`;

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-100 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-800">VIT-HEALTH Login</h1>
          <p className="text-slate-500 text-sm mt-2">Select your portal to continue</p>
        </div>

        <div className="flex p-1 bg-slate-100 rounded-lg mb-8 overflow-x-auto">
          <button onClick={() => setActiveTab('student')} className={tabCls('student')}><GraduationCap className="w-4 h-4 mr-1" /> Student</button>
          <button onClick={() => setActiveTab('doctor')}  className={tabCls('doctor')}><Stethoscope className="w-4 h-4 mr-1" /> Doctor</button>
          <button onClick={() => setActiveTab('parent')}  className={tabCls('parent')}><Users className="w-4 h-4 mr-1" /> Parent</button>
          <button onClick={() => setActiveTab('faculty')} className={tabCls('faculty')}><BookOpen className="w-4 h-4 mr-1" /> Faculty</button>
        </div>

        <div className="space-y-4">
          {/* ── Student ── */}
          {activeTab === 'student' && (
            <form onSubmit={(e) => handleLogin(e, 'student')} className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Registration Number</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input required type="text" placeholder="e.g. 24BCE10249" className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input required type="password" placeholder="••••••••" className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                </div>
              </div>
              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg font-medium transition-colors mt-6">Login as Student</button>
            </form>
          )}

          {/* ── Doctor ── */}
          {activeTab === 'doctor' && (
            <form onSubmit={(e) => handleLogin(e, 'doctor')} className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Employee ID</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input required type="text" placeholder="e.g. 24BCE10245" className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input required type="password" placeholder="••••••••" className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                </div>
              </div>
              <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-lg font-medium transition-colors mt-6">Login as Doctor</button>
            </form>
          )}

          {/* ── Parent ── */}
          {activeTab === 'parent' && (
            <form onSubmit={(e) => handleLogin(e, 'parent')} className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-4">
              <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-lg text-xs text-indigo-700 font-medium">
                Enter your child's Reg No, your registered email, and your child's Date of Birth to access the Parent Portal.
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Student Registration No.</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input required type="text" placeholder="e.g. 24BCE10249" className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none uppercase" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Parent Registered Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input required type="email" placeholder="parent@example.com" className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Student Date of Birth</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input required type="date" className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" />
                </div>
                <p className="text-xs text-slate-400 mt-1">This acts as your access key. Format: DD/MM/YYYY</p>
              </div>
              <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-lg font-medium transition-colors mt-6">Access Parent Portal</button>
            </form>
          )}

          {/* ── Faculty ── */}
          {activeTab === 'faculty' && (
            <form onSubmit={(e) => handleLogin(e, 'faculty')} className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Faculty ID</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input required type="text" placeholder="e.g. 26BCE4078" className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input required type="password" placeholder="••••••••" className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                </div>
              </div>
              <button type="submit" className="w-full bg-slate-800 hover:bg-slate-900 text-white py-2.5 rounded-lg font-medium transition-colors mt-6">Login as Faculty</button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
