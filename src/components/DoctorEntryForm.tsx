import React, { useState, useRef } from 'react';
import { FilePlus2, User, Activity, Clock, Pill, Stethoscope, CheckCircle2, Search, Loader2, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { fetchWithAuth } from '../lib/api';

export default function DoctorEntryForm({ onLogCreated }: { onLogCreated?: () => void }) {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [studentFound, setStudentFound] = useState<boolean | null>(null);
  const [formData, setFormData] = useState({
    studentName: '',
    studentId: '',
    studentBlock: '',
    illness: '',
    expectedDuration: '',
    diagnosis: '',
    prescription: ''
  });

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (name === 'studentId') {
      setStudentFound(null);
      setFormData(prev => ({ ...prev, studentName: '', studentBlock: '', studentId: value }));

      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (value.trim().length >= 6) {
        debounceRef.current = setTimeout(() => lookupStudent(value.trim()), 600);
      }
    }
  };

  const lookupStudent = async (regNo: string) => {
    setIsFetching(true);
    try {
      const data = await fetchWithAuth(`/auth/student/${regNo}`);
      setFormData(prev => ({
        ...prev,
        studentName: data.name,
        studentBlock: data.block
      }));
      setStudentFound(true);
      toast.success(`Student found: ${data.name}`);
    } catch {
      setStudentFound(false);
      setFormData(prev => ({ ...prev, studentName: '', studentBlock: '' }));
      toast.error('No student found with this Registration Number.');
    } finally {
      setIsFetching(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentFound) {
      toast.error('Please enter a valid Registration Number first.');
      return;
    }
    try {
      await fetchWithAuth('/health/create', {
        method: 'POST',
        body: JSON.stringify({
          studentId: formData.studentId,
          studentName: formData.studentName,
          studentBlock: formData.studentBlock,
          illness: formData.illness,
          expectedDuration: formData.expectedDuration,
          diagnosis: formData.diagnosis,
          prescription: formData.prescription
        })
      });

      setIsSubmitted(true);
      toast.success('Medical log created successfully.');
      setFormData({ studentName: '', studentId: '', studentBlock: '', illness: '', expectedDuration: '', diagnosis: '', prescription: '' });
      setStudentFound(null);
      setTimeout(() => {
        setIsSubmitted(false);
        onLogCreated?.();
      }, 2000);
    } catch (error) {
      console.error('Log creation error:', error);
      toast.error('Failed to create medical log. Please try again.');
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-6 border-b border-slate-100 bg-blue-50/50">
        <h2 className="text-lg font-semibold text-blue-900 flex items-center">
          <FilePlus2 className="w-5 h-5 mr-2 text-blue-600" />
          Initiate New Health Log
        </h2>
        <p className="text-sm text-blue-700/70 mt-1">Enter the Registration Number — student details will auto-fill.</p>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Student Details */}
          <div className="space-y-4">
            {/* Registration Number with auto-fetch */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Registration Number</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  required
                  name="studentId"
                  value={formData.studentId}
                  onChange={handleChange}
                  type="text"
                  placeholder="e.g. 24BCE10249"
                  className={`w-full pl-9 pr-10 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm font-mono uppercase transition-colors ${
                    studentFound === true ? 'border-green-400 bg-green-50' :
                    studentFound === false ? 'border-red-400 bg-red-50' :
                    'border-slate-300'
                  }`}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {isFetching && <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />}
                  {studentFound === true && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                </div>
              </div>
            </div>

            {/* Auto-filled Student Name */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Student Name
                {studentFound && <span className="ml-2 text-xs text-green-600 font-semibold">Auto-filled</span>}
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  readOnly
                  name="studentName"
                  value={formData.studentName}
                  type="text"
                  placeholder="Fetched automatically..."
                  className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-600 cursor-not-allowed"
                />
              </div>
            </div>

            {/* Auto-filled Block */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Hostel Block
                {studentFound && <span className="ml-2 text-xs text-green-600 font-semibold">Auto-filled</span>}
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  readOnly
                  name="studentBlock"
                  value={formData.studentBlock}
                  type="text"
                  placeholder="Fetched automatically..."
                  className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-600 cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* Illness Details */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Primary Illness / Symptom</label>
              <div className="relative">
                <Activity className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input required name="illness" value={formData.illness} onChange={handleChange} type="text" placeholder="e.g. Viral Fever" className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Expected Duration</label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <select required name="expectedDuration" value={formData.expectedDuration} onChange={handleChange} className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm appearance-none bg-white">
                  <option value="">Select duration...</option>
                  <option value="1-3 Days">1-3 Days</option>
                  <option value="3-7 Days">3-7 Days</option>
                  <option value="1-2 Weeks">1-2 Weeks</option>
                  <option value="1 Month+">1 Month+</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Medical Details */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center">
              <Stethoscope className="w-4 h-4 mr-1 text-slate-400" /> Diagnosis Notes
            </label>
            <textarea required name="diagnosis" value={formData.diagnosis} onChange={handleChange} rows={3} placeholder="Detailed clinical findings..." className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm resize-none"></textarea>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center">
              <Pill className="w-4 h-4 mr-1 text-slate-400" /> Prescription & Advice
            </label>
            <textarea required name="prescription" value={formData.prescription} onChange={handleChange} rows={3} placeholder="Medications, dosage, and rest advice..." className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm resize-none"></textarea>
          </div>
        </div>

        <div className="flex items-center justify-end pt-4">
          {isSubmitted ? (
            <div className="flex items-center text-green-600 font-medium animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 mr-2" />
              Log Created Successfully
            </div>
          ) : (
            <button
              type="submit"
              disabled={!studentFound}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-lg font-medium transition-colors shadow-sm"
            >
              Create Active Log
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
