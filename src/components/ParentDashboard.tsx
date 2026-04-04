import { useState, useEffect, useCallback } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import {
  Heart, FileText, Calendar, History, TrendingUp, ChevronRight,
  CheckCircle2, XCircle, AlertCircle, MapPin, Loader2, ShieldAlert,
  Activity, Clock
} from 'lucide-react';
import { toast } from 'sonner';
import { fetchWithAuth } from '../lib/api';
import LeaveStatusStepper from './LeaveStatusStepper';

type Tab = 'health' | 'leaves' | 'trends';

const VERIFICATION_LABELS: Record<string, { label: string; color: string }> = {
  none:             { label: 'No Leave Applied',  color: 'bg-slate-100 text-slate-600' },
  applied:          { label: 'Leave Applied',      color: 'bg-yellow-100 text-yellow-700' },
  doctor_verified:  { label: 'Doctor Verified',    color: 'bg-blue-100 text-blue-700' },
  proctor_approved: { label: 'Proctor Approved',   color: 'bg-green-100 text-green-700' },
  rejected:         { label: 'Rejected',           color: 'bg-red-100 text-red-700' }
};

const CHART_COLORS = ['#ef4444', '#0d9488', '#f59e0b', '#6366f1', '#ec4899'];

export default function ParentDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('health');
  const [logs, setLogs] = useState<any[]>([]);
  const [outbreakData, setOutbreakData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [outbreakLoading, setOutbreakLoading] = useState(false);
  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  const user = (() => {
    try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; }
  })();

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchWithAuth('/health');
      setLogs(data);
    } catch {
      toast.error('Failed to load medical records.');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchOutbreak = useCallback(async () => {
    setOutbreakLoading(true);
    try {
      const data = await fetchWithAuth('/health/analytics/outbreak');
      setOutbreakData(data);
    } catch {
      toast.error('Failed to load trend data.');
    } finally {
      setOutbreakLoading(false);
    }
  }, []);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);
  useEffect(() => { if (activeTab === 'trends') fetchOutbreak(); }, [activeTab, fetchOutbreak]);

  const activeLog = logs.find(l => l.status === 'active');
  const leaveRequests = logs.filter(l => l.leaveStatus && l.leaveStatus !== 'none');
  const closedLogs = logs.filter(l => l.status === 'closed');
  const illnessKeys = outbreakData ? Object.keys(outbreakData.illnessTotals || {}) : [];

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'health', label: 'Medical Records', icon: <Activity className="w-4 h-4" /> },
    { id: 'leaves', label: `Leave History (${leaveRequests.length})`, icon: <Calendar className="w-4 h-4" /> },
    { id: 'trends', label: 'Health Trends', icon: <TrendingUp className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Parent Portal</h1>
          <p className="text-slate-500 text-sm mt-1">
            Monitoring health records for <span className="font-semibold text-indigo-600">{user.studentName || user.linkedStudent}</span>
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 border border-indigo-100 rounded-xl text-sm text-indigo-700 font-medium">
          <Heart className="w-4 h-4 text-indigo-400" />
          <span>Read-Only View</span>
        </div>
      </div>

      {/* Current Status Banner */}
      {activeLog && (
        <div className="flex items-center gap-4 p-4 bg-orange-50 border border-orange-200 rounded-xl">
          <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center shrink-0">
            <Activity className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <p className="font-bold text-orange-900 text-sm">Currently Under Treatment</p>
            <p className="text-orange-700 text-sm">
              <span className="font-medium">{activeLog.illness}</span> — {activeLog.diagnosis}
            </p>
          </div>
          <span className="ml-auto text-xs font-bold px-3 py-1 rounded-full bg-orange-100 text-orange-700">Active</span>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Records', value: logs.length, icon: <FileText className="w-5 h-5 text-teal-600" /> },
          { label: 'Active Cases', value: logs.filter(l => l.status === 'active').length, icon: <Activity className="w-5 h-5 text-orange-500" /> },
          { label: 'Closed Cases', value: closedLogs.length, icon: <CheckCircle2 className="w-5 h-5 text-green-500" /> },
          { label: 'Leave Requests', value: leaveRequests.length, icon: <Calendar className="w-5 h-5 text-indigo-500" /> },
        ].map(stat => (
          <div key={stat.label} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="mb-2">{stat.icon}</div>
            <p className="text-2xl font-bold text-slate-800">{loading ? '—' : stat.value}</p>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-widest mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex border-b border-slate-200 bg-slate-50/80">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-4 text-sm font-semibold transition-all border-b-2 -mb-px ${
                activeTab === tab.id
                  ? 'border-indigo-600 text-indigo-700 bg-white'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-white/50'
              }`}
            >
              {tab.icon}{tab.label}
            </button>
          ))}
        </div>

        <div className="p-6 sm:p-8">
          {/* ── TAB 1: Medical Records ── */}
          {activeTab === 'health' && (
            loading ? (
              <div className="flex items-center justify-center py-16 text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading records...
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                <Heart className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No medical records found for this student.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {logs.map(log => {
                  const vs = VERIFICATION_LABELS[log.verificationStatus || log.leaveStatus || 'none'];
                  const isExpanded = expandedLog === log._id;
                  return (
                    <div key={log._id} className="border border-slate-200 rounded-xl overflow-hidden">
                      <button
                        className="w-full text-left p-5 flex items-start justify-between gap-4 hover:bg-slate-50 transition-colors"
                        onClick={() => setExpandedLog(isExpanded ? null : log._id)}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 flex-wrap">
                            <p className="font-bold text-slate-800">{log.illness}</p>
                            <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                              log.status === 'active' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'
                            }`}>
                              {log.status === 'active' ? 'Under Treatment' : 'Recovered'}
                            </span>
                            <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${vs.color}`}>
                              {vs.label}
                            </span>
                          </div>
                          <p className="text-sm text-slate-500 mt-1">{log.diagnosis}</p>
                          <p className="text-xs text-slate-400 mt-1">
                            {new Date(log.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </p>
                        </div>
                        <ChevronRight className={`w-4 h-4 text-slate-400 shrink-0 mt-1 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                      </button>

                      {isExpanded && (
                        <div className="border-t border-slate-100 bg-slate-50/40 p-5 space-y-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs font-bold uppercase text-slate-400 tracking-widest mb-1">Prescription</p>
                              <p className="text-sm text-slate-700">{log.prescription || '—'}</p>
                            </div>
                            <div>
                              <p className="text-xs font-bold uppercase text-slate-400 tracking-widest mb-1">Duration</p>
                              <p className="text-sm text-slate-700">{log.expectedDuration || '—'}</p>
                            </div>
                          </div>

                          {/* Verification Status Track */}
                          {log.leaveStatus && log.leaveStatus !== 'none' && (
                            <div>
                              <p className="text-xs font-bold uppercase text-slate-400 tracking-widest mb-3">Leave Verification Status</p>
                              <div className="flex items-center gap-2 flex-wrap">
                                {[
                                  { key: 'applied', label: 'Applied' },
                                  { key: 'doctor_verified', label: 'Doctor Verified' },
                                  { key: 'proctor_approved', label: 'Proctor Approved' }
                                ].map((step, idx) => {
                                  const current = log.leaveStatus || 'none';
                                  const order = ['none', 'applied', 'doctor_verified', 'proctor_approved'];
                                  const stepDone = order.indexOf(current) >= order.indexOf(step.key);
                                  const isRejected = current === 'rejected';
                                  return (
                                    <div key={step.key} className="flex items-center gap-2">
                                      <span className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full ${
                                        isRejected ? 'bg-red-100 text-red-700' :
                                        stepDone ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-400'
                                      }`}>
                                        {stepDone && !isRejected ? <CheckCircle2 className="w-3.5 h-3.5" /> :
                                         isRejected ? <XCircle className="w-3.5 h-3.5" /> :
                                         <AlertCircle className="w-3.5 h-3.5" />}
                                        {step.label}
                                      </span>
                                      {idx < 2 && <ChevronRight className="w-3.5 h-3.5 text-slate-300" />}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Timeline */}
                          {log.timeline?.length > 0 && (
                            <div>
                              <p className="text-xs font-bold uppercase text-slate-400 tracking-widest mb-3">Case Timeline</p>
                              <ol className="space-y-3">
                                {log.timeline.map((entry: any, i: number) => (
                                  <li key={i} className="flex gap-3">
                                    <div className="flex flex-col items-center">
                                      <div className={`w-2.5 h-2.5 rounded-full mt-1 shrink-0 ${
                                        entry.type === 'closed' ? 'bg-slate-400' :
                                        entry.type === 'doctor_entry' ? 'bg-indigo-500' : 'bg-teal-500'
                                      }`} />
                                      {i < log.timeline.length - 1 && <div className="w-px flex-1 bg-slate-200 mt-1" />}
                                    </div>
                                    <div className="pb-3">
                                      <p className="text-sm text-slate-700">{entry.note}</p>
                                      <p className="text-xs text-slate-400 mt-0.5">{entry.author} · {new Date(entry.date).toLocaleDateString()}</p>
                                    </div>
                                  </li>
                                ))}
                              </ol>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )
          )}

          {/* ── TAB 2: Leave History ── */}
          {activeTab === 'leaves' && (
            leaveRequests.length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                <Calendar className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No leave requests found.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {leaveRequests.map(log => (
                  <div key={log._id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <div className="p-5 border-b border-slate-100 flex flex-wrap justify-between items-center gap-4 bg-slate-50/50">
                      <div className="flex items-center gap-4">
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                          log.leaveStatus === 'proctor_approved' ? 'bg-green-100 text-green-600' :
                          log.leaveStatus === 'rejected' ? 'bg-red-100 text-red-600' :
                          'bg-indigo-100 text-indigo-600'
                        }`}>
                          <Calendar className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 text-sm">{log.illness}</p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {log.leaveStartDate ? new Date(log.leaveStartDate).toLocaleDateString() : '—'} →{' '}
                            {log.leaveEndDate ? new Date(log.leaveEndDate).toLocaleDateString() : '—'}
                          </p>
                        </div>
                      </div>
                      <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
                        log.leaveStatus === 'proctor_approved' ? 'bg-green-100 text-green-700' :
                        log.leaveStatus === 'rejected' ? 'bg-red-100 text-red-700' :
                        log.leaveStatus === 'doctor_verified' ? 'bg-blue-100 text-blue-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {log.leaveStatus?.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="p-5">
                      <div className="mb-6">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Live Status Tracker</p>
                        <LeaveStatusStepper status={log.leaveStatus} />
                      </div>
                      {log.leaveReason && (
                        <div className="bg-slate-50 p-3 rounded-lg">
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Leave Reason</p>
                          <p className="text-sm text-slate-700">{log.leaveReason}</p>
                        </div>
                      )}
                      {log.rejectionReason && (
                        <div className="bg-red-50 border border-red-100 p-3 rounded-lg mt-3">
                          <p className="text-xs font-bold text-red-600 uppercase tracking-widest mb-1">Rejection Reason</p>
                          <p className="text-sm text-red-700">{log.rejectionReason}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

          {/* ── TAB 3: Health Trends ── */}
          {activeTab === 'trends' && (
            outbreakLoading ? (
              <div className="flex items-center justify-center py-20 text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading campus trend data...
              </div>
            ) : (
              <div className="space-y-8">
                <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl text-sm text-indigo-700">
                  <p className="font-semibold">Campus-Wide Health Overview</p>
                  <p className="text-xs mt-1 opacity-80">This view shows overall illness trends across the campus to keep you informed.</p>
                </div>

                {outbreakData?.alerts?.filter((a: any) => !a.acknowledged).length > 0 && (
                  <div className="space-y-3">
                    <p className="text-xs font-bold uppercase text-slate-500 tracking-widest">Active Outbreak Alerts</p>
                    {outbreakData.alerts.filter((a: any) => !a.acknowledged).map((alert: any, i: number) => (
                      <div key={i} className="flex items-center gap-4 p-4 rounded-xl border bg-red-50 border-red-200 text-red-800">
                        <ShieldAlert className="w-6 h-6 text-red-500 shrink-0 animate-pulse" />
                        <div>
                          <p className="font-bold text-sm">
                            High Risk of {alert.illness.charAt(0).toUpperCase() + alert.illness.slice(1)} Outbreak — {alert.block}
                          </p>
                          <p className="text-xs mt-0.5 opacity-80">{alert.count} cases in last 7 days. College health authorities are monitoring the situation.</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {outbreakData?.chartData?.length > 0 && (
                  <div>
                    <p className="text-xs font-bold uppercase text-slate-500 tracking-widest mb-6">Illness Trends — Last 7 Days</p>
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={outbreakData.chartData} margin={{ top: 10, right: 30, left: -20, bottom: 0 }}>
                          <defs>
                            {illnessKeys.map((key, i) => (
                              <linearGradient key={key} id={`parent-color-${i}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={CHART_COLORS[i % CHART_COLORS.length]} stopOpacity={0.2} />
                                <stop offset="95%" stopColor={CHART_COLORS[i % CHART_COLORS.length]} stopOpacity={0} />
                              </linearGradient>
                            ))}
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} allowDecimals={false} />
                          <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', padding: '12px' }} />
                          <Legend verticalAlign="top" height={50} iconType="circle" wrapperStyle={{ fontSize: '13px' }} />
                          {illnessKeys.map((key, i) => (
                            <Area
                              key={key}
                              type="monotone"
                              name={key.charAt(0).toUpperCase() + key.slice(1)}
                              dataKey={key}
                              stroke={CHART_COLORS[i % CHART_COLORS.length]}
                              strokeWidth={2}
                              fillOpacity={1}
                              fill={`url(#parent-color-${i})`}
                            />
                          ))}
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {outbreakData?.blockIllnessMap && (
                  <div>
                    <p className="text-xs font-bold uppercase text-slate-500 tracking-widest mb-4">Block-wise Case Distribution</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {Object.entries(outbreakData.blockIllnessMap).map(([block, illnesses]: [string, any]) => {
                        const total = Object.values(illnesses as Record<string, number>).reduce((a, b) => a + b, 0);
                        return (
                          <div key={block} className="border border-slate-200 rounded-xl p-4">
                            <div className="flex justify-between mb-3">
                              <p className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                                <MapPin className="w-3.5 h-3.5 text-slate-400" />{block}
                              </p>
                              <span className="text-xs font-semibold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full">{total} cases</span>
                            </div>
                            {Object.entries(illnesses as Record<string, number>).map(([illness, count]) => (
                              <div key={illness} className="flex justify-between items-center mb-1.5">
                                <span className="text-xs text-slate-600 capitalize">{illness}</span>
                                <span className="text-xs font-bold text-slate-700">{count}</span>
                              </div>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
