import React, { useState, useEffect } from 'react';
import { Search, UserCircle, Shield, AlertCircle, CheckCircle, ChevronDown, ChevronUp, RefreshCw, FileText, Users } from 'lucide-react';
import { toast } from 'sonner';
import HealthTimeline from './HealthTimeline';
import ApproverDashboard from './ApproverDashboard';
import { fetchWithAuth } from '../lib/api';

export default function FacultyDashboard() {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedStudent, setExpandedStudent] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [leaveRequests, setLeaveRequests] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsRefreshing(true);
    try {
      const fetchedLogs = await fetchWithAuth('/health');
      setLogs(fetchedLogs);

      // Extract leave requests
      const requests = fetchedLogs
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
          doctorNote: log.timeline.find((t: any) => t.type === 'doctor_entry' && t.note.includes('Leave Verified'))?.note
        }));
      setLeaveRequests(requests);

      // Derive unique students from logs for the prototype
      const uniqueStudents = Array.from(new Set(fetchedLogs.map((l: any) => l.studentId))).map(id => {
        const studentLogs = fetchedLogs.filter((l: any) => l.studentId === id);
        const activeLog = studentLogs.find((l: any) => l.status === 'active');
        const name = studentLogs[0]?.studentName || 'Unknown';
        
        let status = 'Healthy';
        if (activeLog) {
           status = activeLog.leaveStatus === 'proctor_approved' ? 'On Leave' : 'In Treatment';
        }

        return {
          id: id as string,
          name,
          course: 'B.Tech', // Placeholder
          year: '2nd Year', // Placeholder
          status,
          lastUpdate: new Date(studentLogs[0]?.updatedAt || Date.now()).toLocaleDateString()
        };
      });
      setStudents(uniqueStudents);

    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    fetchData();
    toast.success('Student health data refreshed successfully.');
  };

  const handleLeaveAction = async (requestId: string, action: 'approve' | 'reject', note?: string) => {
    try {
      await fetchWithAuth(`/leave/approve-proctor/${requestId}`, {
        method: 'PATCH',
        body: JSON.stringify({ action, note })
      });

      setLeaveRequests(prev => prev.map(req => {
        if (req.id === requestId) {
          return {
            ...req,
            status: action === 'approve' ? 'proctor_approved' : 'rejected',
            proctorNote: action === 'approve' ? 'Academic leave approved.' : undefined,
            rejectionReason: action === 'reject' ? note : undefined
          };
        }
        return req;
      }));
      toast.success(`Leave request ${action === 'approve' ? 'approved' : 'rejected'} successfully.`);
    } catch (error) {
      console.error('Leave action error:', error);
      toast.error('Failed to process leave request.');
    }
  };

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'Healthy':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-700 shadow-sm"><CheckCircle className="w-3 h-3 mr-1"/> Healthy</span>;
      case 'On Leave':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-orange-700 shadow-sm"><AlertCircle className="w-3 h-3 mr-1"/> On Leave</span>;
      case 'In Treatment':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700 shadow-sm"><Shield className="w-3 h-3 mr-1"/> In Treatment</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 shadow-sm">Unknown</span>;
    }
  };

  const getStudentLog = (regNo: string) => {
    return logs.find(log => log.studentId === regNo && log.status === 'active');
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Faculty Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">Manage academic leave approvals and student wellbeing.</p>
        </div>
        <button 
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center space-x-2 px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm active:scale-95 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Pending Leaves Queue for Faculty */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-teal-50 to-teal-100/50">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white rounded-lg shadow-sm">
              <FileText className="w-5 h-5 text-teal-600" />
            </div>
            <h2 className="text-lg font-bold text-teal-900">Pending Leave Approvals</h2>
          </div>
          <p className="text-sm text-teal-700 mt-1 ml-11 font-medium">Leaves that have been medically verified by the Doctor.</p>
        </div>
        <div className="p-6 bg-slate-50/50">
          <ApproverDashboard 
            role="proctor" 
            requests={leaveRequests.filter(r => r.status === 'doctor_verified')} 
            onAction={handleLeaveAction}
          />
        </div>
      </div>

      {/* Student Observations */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white rounded-lg shadow-sm border border-slate-200">
              <Users className="w-5 h-5 text-slate-600" />
            </div>
            <h2 className="text-lg font-bold text-slate-800">Student Roster</h2>
          </div>
          <div className="relative max-w-md w-full sm:w-1/3">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl leading-5 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent sm:text-sm shadow-sm transition-all"
              placeholder="Search student..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-white">
              <tr>
                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">Student</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">Program</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">Status</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">Medical Log</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {filteredStudents.map((student) => {
                const activeLog = getStudentLog(student.id);
                const isExpanded = expandedStudent === student.id;

                return (
                  <React.Fragment key={student.id}>
                    <tr className={`hover:bg-slate-50 transition-colors ${isExpanded ? 'bg-teal-50/30' : ''}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-slate-100 rounded-full flex items-center justify-center">
                            <span className="text-lg font-bold text-slate-500">{student.name.charAt(0)}</span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-bold text-slate-800">{student.name}</div>
                            <div className="text-xs text-slate-500 uppercase tracking-wider mt-0.5">{student.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-slate-700">{student.course}</div>
                        <div className="text-xs text-slate-400 mt-0.5">{student.year}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(student.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {activeLog ? (
                          <button 
                            onClick={() => setExpandedStudent(isExpanded ? null : student.id)}
                            className="flex items-center text-teal-600 hover:text-teal-800 transition-colors bg-teal-50 px-3 py-1.5 rounded-lg"
                          >
                            {isExpanded ? 'Hide Details' : 'View Case'}
                            {isExpanded ? <ChevronUp className="w-4 h-4 ml-1.5" /> : <ChevronDown className="w-4 h-4 ml-1.5" />}
                          </button>
                        ) : (
                          <span className="text-slate-400 px-3">No active case</span>
                        )}
                      </td>
                    </tr>
                    {isExpanded && activeLog && (
                      <tr className="bg-slate-50/50 border-t border-teal-100 shadow-inner">
                        <td colSpan={4} className="px-6 py-8">
                          <div className="max-w-4xl mx-auto bg-white rounded-xl border border-slate-200 p-8 shadow-sm">
                            <div className="flex justify-between items-start mb-8 pb-6 border-b border-slate-100">
                              <div>
                                <h3 className="text-xl font-bold text-teal-900">{activeLog.illness}</h3>
                                <p className="text-sm text-slate-600 mt-1 font-medium bg-slate-100 px-2 py-1 rounded inline-block">Diagnosis: {activeLog.diagnosis}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Expected Duration</p>
                                <p className="text-sm font-bold text-slate-700 mt-1">{activeLog.expectedDuration}</p>
                              </div>
                            </div>
                            
                            <div className="mb-8">
                              <h4 className="text-xs font-bold text-teal-600 uppercase tracking-widest mb-3">Active Prescription</h4>
                              <div className="bg-teal-50/50 text-teal-900 p-4 rounded-xl border border-teal-100 font-medium text-sm leading-relaxed">
                                {activeLog.prescription}
                              </div>
                            </div>

                            <div>
                              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Treatment Timeline</h4>
                              <HealthTimeline events={activeLog.timeline} />
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
              {filteredStudents.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <UserCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-sm text-slate-500 font-medium">No students found matching "{searchTerm}"</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
