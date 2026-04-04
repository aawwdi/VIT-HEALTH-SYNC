import React, { useState, useEffect } from 'react';
import { Activity, FileText, CheckCircle2, Clock, AlertTriangle, Calendar, PlusCircle, FilePlus2, XCircle, History, Upload, Paperclip } from 'lucide-react';
import { toast } from 'sonner';
import HealthTimeline from './HealthTimeline';
import LeaveStatusStepper from './LeaveStatusStepper';
import { fetchWithAuth } from '../lib/api';

type TabType = 'active' | 'leave' | 'history';

export default function StudentDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>('active');
  const [activeLog, setActiveLog] = useState<any>(null);
  const [historyLogs, setHistoryLogs] = useState<any[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [updateText, setUpdateText] = useState('');
  const [showUrgentAlert, setShowUrgentAlert] = useState(false);
  const [showLeaveForm, setShowLeaveForm] = useState(false);

  // Leave Form State
  const [leaveReason, setLeaveReason] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  const todayDate = new Date().toISOString().split('T')[0];

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const logs = await fetchWithAuth('/health');
      if (logs && logs.length > 0) {
        // Separate active and closed logs
        const active = logs.find((l: any) => l.status === 'active');
        const closed = logs.filter((l: any) => l.status === 'closed');
        
        setActiveLog(active || null);
        setHistoryLogs(closed);

        // Aggregate all leave requests from all logs (both active and closed) for the leave tab
        const allLeaveRequests = logs
          .filter((log: any) => log.leaveStatus && log.leaveStatus !== 'none')
          .map((log: any) => ({
            id: log._id,
            studentRegNo: log.studentId,
            studentName: log.studentName,
            logId: log._id,
            reason: log.leaveReason,
            startDate: new Date(log.leaveStartDate).toLocaleDateString(),
            endDate: new Date(log.leaveEndDate).toLocaleDateString(),
            status: log.leaveStatus,
            appliedDate: log.createdAt,
            rejectionReason: log.rejectionReason,
            doctorNote: log.timeline.find((t:any) => t.type === 'doctor_entry' && t.note.includes('Leave Verified'))?.note
          }));
        
        setLeaveRequests(allLeaveRequests);
      }
    } catch (error) {
      console.error('Failed to fetch logs:', error);
      toast.error('Failed to load health logs');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!updateText.trim() || !activeLog) return;

    try {
      const criticalKeywords = ['still suffering', 'worsening', 'severe', 'not improving', 'pain'];
      const isCritical = criticalKeywords.some((kw) => updateText.toLowerCase().includes(kw));

      const updatedLog = await fetchWithAuth(`/health/update/${activeLog._id}`, {
        method: 'PATCH',
        body: JSON.stringify({ note: updateText, isCritical })
      });

      if (isCritical) {
        setShowUrgentAlert(true);
        toast.error('Urgent alert triggered based on your symptoms.');
      } else {
        toast.success('Status update submitted successfully.');
      }

      setActiveLog(updatedLog);
      setUpdateText('');
    } catch (error) {
      console.error('Update error:', error);
      toast.error('Failed to submit status update.');
    }
  };

  const handleCloseLog = async () => {
    if (!activeLog) return;
    try {
      const updatedLog = await fetchWithAuth(`/health/update/${activeLog._id}`, {
        method: 'PATCH',
        body: JSON.stringify({ note: 'Student marked condition as cured/closed.', closeLog: true })
      });

      setActiveLog(null);
      setHistoryLogs([updatedLog, ...historyLogs]);
      setShowUrgentAlert(false);
      toast.success('Medical log closed successfully.');
    } catch (error) {
      console.error('Close log error:', error);
      toast.error('Failed to close medical log.');
    }
  };

  const handleLeaveRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeLog) return;
    
    // Future proof: Handle file upload if present
    // For now we just show a successful submission
    try {
      const updatedLog = await fetchWithAuth(`/leave/apply/${activeLog._id}`, {
        method: 'POST',
        body: JSON.stringify({ startDate, endDate, reason: leaveReason })
      });

      setActiveLog(updatedLog);
      
      const newRequest = {
        id: updatedLog._id, // Replace with existing if updating state
        studentRegNo: updatedLog.studentId,
        studentName: updatedLog.studentName,
        logId: updatedLog._id,
        reason: updatedLog.leaveReason,
        startDate: new Date(updatedLog.leaveStartDate).toLocaleDateString(),
        endDate: new Date(updatedLog.leaveEndDate).toLocaleDateString(),
        status: updatedLog.leaveStatus,
        appliedDate: updatedLog.createdAt,
        rejectionReason: updatedLog.rejectionReason
      };

      setLeaveRequests((prev) => {
        // filter out the old one if it existed for this log, and add the new one
        const filtered = prev.filter(r => r.logId !== updatedLog._id);
        return [newRequest, ...filtered];
      });
      
      setShowLeaveForm(false);
      setLeaveReason('');
      setStartDate('');
      setEndDate('');
      setActiveTab('leave');
      toast.success('Medical leave request submitted successfully.');
    } catch (error) {
      console.error('Leave request error:', error);
      toast.error('Failed to submit leave request.');
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Student Portal</h1>
          <p className="text-slate-500 mt-1">Manage your medical logs and leave applications.</p>
        </div>
        <div className="flex space-x-2 p-1 bg-slate-200/50 backdrop-blur-md rounded-xl shadow-inner w-fit">
          <button
            onClick={() => setActiveTab('active')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 flex items-center ${activeTab === 'active' ? 'bg-white text-teal-700 modern-shadow' : 'text-slate-600 hover:text-slate-900'}`}
          >
            <Activity className="w-4 h-4 mr-2" /> Active Log
          </button>
          <button
            onClick={() => setActiveTab('leave')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 flex items-center ${activeTab === 'leave' ? 'bg-white text-teal-700 modern-shadow' : 'text-slate-600 hover:text-slate-900'}`}
          >
            <FileText className="w-4 h-4 mr-2" /> Leave Requests
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 flex items-center ${activeTab === 'history' ? 'bg-white text-teal-700 modern-shadow' : 'text-slate-600 hover:text-slate-900'}`}
          >
            <History className="w-4 h-4 mr-2" /> History
          </button>
        </div>
      </div>

      {showUrgentAlert && activeTab === 'active' && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-xl modern-shadow animate-in fade-in slide-in-from-top-2">
          <div className="flex items-start">
            <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 mr-3" />
            <div>
              <h3 className="text-red-800 font-bold">Urgent Medical Attention Required</h3>
              <p className="text-red-700 text-sm mt-1">
                Based on your recent update, your condition appears to be worsening. Please visit the Health Centre again immediately.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Render Active Log */}
      {activeTab === 'active' && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          {!activeLog ? (
            <div className="text-center py-16 bg-white/60 backdrop-blur-md rounded-2xl border border-slate-200 modern-shadow">
              <div className="w-16 h-16 bg-teal-50 text-teal-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-slate-800">No Active Medical Logs</h2>
              <p className="text-slate-500 mt-2">You are currently marked as healthy. Stay well!</p>
            </div>
          ) : (
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white shadow-xl overflow-hidden">
              <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-teal-50 to-teal-100/50 flex flex-wrap justify-between items-center gap-4">
                <div>
                  <h2 className="text-xl font-bold text-teal-900 flex items-center">
                    <Activity className="w-6 h-6 mr-3 text-teal-600" />
                    {activeLog.illness}
                  </h2>
                  <p className="text-base text-teal-800/80 mt-1 font-medium">Diagnosis: {activeLog.diagnosis}</p>
                </div>
                <div className="flex items-center gap-3">
                  {(!activeLog.leaveStatus || activeLog.leaveStatus === 'none') && (
                    <button 
                      onClick={() => { setActiveTab('leave'); setShowLeaveForm(true); }}
                      className="flex items-center px-4 py-2 bg-white text-teal-700 rounded-xl text-sm font-bold hover:bg-teal-50 transition-colors shadow-sm border border-teal-100"
                    >
                      <PlusCircle className="w-4 h-4 mr-2" /> Apply Leave
                    </button>
                  )}
                  <span className="px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest bg-teal-100 text-teal-700 shadow-sm">
                    In Treatment
                  </span>
                </div>
              </div>

              <div className="p-6 md:p-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">Treatment Timeline</h3>
                  <HealthTimeline events={activeLog.timeline} />
                </div>

                <div className="flex flex-col gap-6">
                  <div className="bg-slate-50/80 backdrop-blur p-6 rounded-2xl border border-slate-200">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center">
                      <Clock className="w-4 h-4 mr-2" /> Provide Status Update
                    </h3>
                    <form onSubmit={handleStatusUpdate} className="space-y-4">
                      <div>
                        <textarea 
                          value={updateText}
                          onChange={(e) => setUpdateText(e.target.value)}
                          required
                          className="w-full bg-white border border-slate-200 rounded-xl p-4 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none resize-none transition-shadow"
                          rows={3}
                          placeholder="How are you feeling today? e.g., Symptoms are improving..."
                        ></textarea>
                      </div>
                      <button type="submit" className="w-full bg-teal-600 hover:bg-teal-700 text-white py-3 rounded-xl font-semibold transition-all shadow-md hover:shadow-lg active:scale-[0.98]">
                        Submit Update
                      </button>
                    </form>
                  </div>

                  <div className="bg-green-50/50 border border-green-100 p-6 rounded-2xl">
                    <h3 className="text-xs font-bold text-green-800 uppercase tracking-widest mb-2 flex items-center">
                      <CheckCircle2 className="w-4 h-4 mr-2 text-green-600" /> Treatment Complete?
                    </h3>
                    <p className="text-xs text-green-700 mb-4 leading-relaxed">Only mark as closed if you have fully recovered and no longer require medical leave or monitoring.</p>
                    <button 
                      onClick={handleCloseLog}
                      className="w-full bg-white border-2 border-green-500 text-green-600 hover:bg-green-500 hover:text-white py-3 rounded-xl font-bold transition-all flex items-center justify-center shadow-sm"
                    >
                      Mark as Cured & Close Log
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Render Leave Requests */}
      {activeTab === 'leave' && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
          {showLeaveForm ? (
            <div className="bg-white/90 backdrop-blur-xl p-8 rounded-2xl border border-slate-200 shadow-xl max-w-3xl mx-auto">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <FilePlus2 className="w-6 h-6 text-teal-600" />
                    Medical Leave Application
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">Submit your request along with supporting documents.</p>
                </div>
                <button onClick={() => setShowLeaveForm(false)} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors">
                  <XCircle className="w-5 h-5 text-slate-500" />
                </button>
              </div>
              
              <form onSubmit={handleLeaveRequest} className="space-y-6">
                <div className="p-4 bg-teal-50/50 border border-teal-100 rounded-xl relative overflow-hidden">
                  <div className="absolute left-0 top-0 w-1 h-full bg-teal-500"></div>
                  <p className="text-xs text-teal-600 font-bold uppercase tracking-widest mb-1">Linked Log</p>
                  <p className="text-base font-semibold text-teal-900">{activeLog?.illness} <span className="opacity-60 text-sm font-normal">({activeLog?._id})</span></p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-widest mb-2">Start Date</label>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input 
                        required 
                        type="date" 
                        min={todayDate}
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all outline-none" 
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-widest mb-2">End Date</label>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input 
                        required 
                        type="date" 
                        min={startDate || todayDate}
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all outline-none" 
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-widest mb-2">Reason provided to Faculty</label>
                  <textarea 
                    required
                    value={leaveReason}
                    onChange={(e) => setLeaveReason(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all outline-none resize-none"
                    rows={4}
                    placeholder="Briefly describe why you need this leave timeframe..."
                  ></textarea>
                </div>

                {/* File Upload Section */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-widest mb-2">Supporting Documents</label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 border-dashed rounded-xl hover:border-teal-400 hover:bg-teal-50/30 transition-all cursor-pointer group">
                    <div className="space-y-2 text-center flex flex-col items-center">
                      <div className="w-12 h-12 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Upload className="w-6 h-6" />
                      </div>
                      <div className="flex text-sm text-slate-600 mt-2">
                        <span className="relative cursor-pointer bg-transparent rounded-md font-medium text-teal-600 hover:text-teal-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-teal-500">
                          <span>Upload a file</span>
                          <input id="file-upload" name="file-upload" type="file" className="sr-only" />
                        </span>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-slate-500 text-center">Prescriptions, lab reports, or doctor's notes (PDF, JPG, PNG)</p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <button type="submit" className="w-full bg-teal-600 hover:bg-teal-700 text-white py-4 rounded-xl font-bold text-base transition-all shadow-md hover:shadow-lg active:scale-[0.98]">
                    Submit Application
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <>
              {(!activeLog?.leaveStatus || activeLog?.leaveStatus === 'none') && activeLog && (
                <div className="flex justify-end mb-4">
                  <button 
                    onClick={() => setShowLeaveForm(true)}
                    className="flex items-center px-5 py-2.5 bg-teal-600 text-white rounded-xl text-sm font-bold hover:bg-teal-700 transition-colors shadow-md"
                  >
                    <PlusCircle className="w-4 h-4 mr-2" /> New Application
                  </button>
                </div>
              )}
              
              {leaveRequests.length === 0 ? (
                <div className="text-center py-20 bg-white/60 backdrop-blur-md rounded-2xl border border-slate-200">
                  <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-700">No Leave Requests</h3>
                  <p className="text-slate-500 text-sm mt-1">You haven't applied for any medical leaves yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {leaveRequests.map((request) => (
                    <div key={request.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:border-teal-300 transition-colors">
                      <div className="p-5 border-b border-slate-100 flex flex-wrap justify-between items-center gap-4 bg-slate-50/50">
                        <div className="flex items-center space-x-4">
                          <div className={`w-12 h-12 rounded-2xl flex justify-center items-center ${
                            request.status === 'proctor_approved' ? 'bg-green-100 text-green-600' :
                            request.status === 'rejected' ? 'bg-red-100 text-red-600' :
                            'bg-teal-100 text-teal-600'
                          }`}>
                            <Calendar className="w-6 h-6" />
                          </div>
                          <div>
                            <h3 className="text-base font-bold text-slate-800">{request.startDate} — {request.endDate}</h3>
                            <p className="text-xs text-slate-500 uppercase tracking-widest mt-0.5">Applied on {new Date(request.appliedDate).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <span className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest shadow-sm ${
                          request.status === 'proctor_approved' ? 'bg-green-100 text-green-700' :
                          request.status === 'rejected' ? 'bg-red-100 text-red-700' :
                          'bg-teal-100 text-teal-700'
                        }`}>
                          {request.status.replace('_', ' ')}
                        </span>
                      </div>
                      
                      <div className="p-6">
                        <div className="mb-8">
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">Live Status Tracker</h4>
                          <LeaveStatusStepper status={request.status} />
                        </div>

                        {request.status === 'rejected' && request.rejectionReason && (
                          <div className="bg-red-50 border border-red-100 p-4 rounded-xl mb-6">
                            <h4 className="text-xs font-bold text-red-800 uppercase tracking-widest mb-1">Rejection Reason:</h4>
                            <p className="text-sm text-red-700 font-medium">{request.rejectionReason}</p>
                          </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="bg-slate-50 p-4 rounded-xl">
                            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 border-b border-slate-200 pb-2">My Reason</h4>
                            <p className="text-slate-800 text-sm leading-relaxed">{request.reason}</p>
                          </div>
                          {request.doctorNote && (
                            <div className="bg-teal-50 p-4 rounded-xl">
                              <h4 className="text-[10px] font-bold text-teal-700 uppercase tracking-widest mb-2 border-b border-teal-200 pb-2">Doctor's Remark</h4>
                              <p className="text-teal-900 text-sm leading-relaxed font-medium">{request.doctorNote}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Render History Tab */}
      {activeTab === 'history' && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          {historyLogs.length === 0 ? (
            <div className="text-center py-20 bg-white/60 backdrop-blur-md rounded-2xl border border-slate-200">
              <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <History className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-semibold text-slate-700">No Past Records</h3>
              <p className="text-slate-500 text-sm mt-1">Your closed medical history will appear here.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {historyLogs.map((log) => (
                <div key={log._id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 hover:shadow-md transition-shadow">
                  <div className="flex flex-wrap justify-between items-start gap-4 mb-4 pb-4 border-b border-slate-100">
                    <div>
                      <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        {log.illness}
                      </h3>
                      <p className="text-sm text-slate-500 mt-1">Diagnosed: {log.diagnosis}</p>
                    </div>
                    <div className="text-right">
                      <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-bold uppercase tracking-widest">
                        Closed on {new Date(log.updatedAt || Date.now()).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  {log.leaveStatus && log.leaveStatus !== 'none' && (
                    <div className="mb-4 inline-flex items-center text-sm font-medium text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                      <Calendar className="w-4 h-4 mr-2 text-teal-600" />
                      Associated Leave: {new Date(log.leaveStartDate).toLocaleDateString()} to {new Date(log.leaveEndDate).toLocaleDateString()}
                    </div>
                  )}
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Timeline Summary</h4>
                  <div className="max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                    <HealthTimeline events={log.timeline} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
