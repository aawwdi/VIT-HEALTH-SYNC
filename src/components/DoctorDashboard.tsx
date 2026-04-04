import { useState, useEffect, useCallback } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import {
  AlertTriangle, Users, ShieldAlert, MapPin, CheckCircle2, Activity,
  Clock, FileText, FilePlus2, Folders, TrendingUp, ChevronRight,
  XCircle, AlertCircle, Loader2, BellOff
} from 'lucide-react';
import { toast } from 'sonner';
import DoctorEntryForm from './DoctorEntryForm';
import ApproverDashboard from './ApproverDashboard';
import { fetchWithAuth } from '../lib/api';

type Tab = 'new-log' | 'cases' | 'trends';
type CaseFilter = 'active' | 'closed';

const VERIFICATION_LABELS: Record<string, { label: string; color: string }> = {
  none:             { label: 'No Leave Applied',      color: 'bg-slate-100 text-slate-600' },
  applied:          { label: 'Leave Applied',          color: 'bg-yellow-100 text-yellow-700' },
  doctor_verified:  { label: 'Doctor Verified',        color: 'bg-blue-100 text-blue-700' },
  proctor_approved: { label: 'Proctor Approved',       color: 'bg-green-100 text-green-700' },
  rejected:         { label: 'Rejected',               color: 'bg-red-100 text-red-700' }
};

export default function DoctorDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('new-log');
  const [caseFilter, setCaseFilter] = useState<CaseFilter>('active');
  const [allLogs, setAllLogs] = useState<any[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<any[]>([]);
  const [outbreakData, setOutbreakData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [outbreakLoading, setOutbreakLoading] = useState(false);
  const [acknowledging, setAcknowledging] = useState<string | null>(null);
  const [expandedCase, setExpandedCase] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const logs = await fetchWithAuth('/health');
      setAllLogs(logs);

      const requests = logs
        .filter((log: any) => log.leaveStatus && log.leaveStatus !== 'none')
        .map((log: any) => ({
          id: log._id,
          studentRegNo: log.studentId,
          studentName: log.studentName,
          logId: log._id,
          reason: log.leaveReason,
          startDate: log.leaveStartDate ? new Date(log.leaveStartDate).toLocaleDateString() : '-',
          endDate: log.leaveEndDate ? new Date(log.leaveEndDate).toLocaleDateString() : '-',
          status: log.leaveStatus,
          appliedDate: log.createdAt,
          rejectionReason: log.rejectionReason,
          doctorNote: log.timeline?.find((t: any) => t.type === 'doctor_entry' && t.note.includes('Leave Verified'))?.note
        }));
      setLeaveRequests(requests);
    } catch (error) {
      console.error('Failed to fetch logs:', error);
      toast.error('Failed to load cases.');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchOutbreak = useCallback(async () => {
    setOutbreakLoading(true);
    try {
      const data = await fetchWithAuth('/health/analytics/outbreak');
      setOutbreakData(data);
    } catch (error) {
      console.error('Failed to fetch outbreak data:', error);
      toast.error('Failed to load trend data.');
    } finally {
      setOutbreakLoading(false);
    }
  }, []);

  const acknowledgeAlert = async (illness: string, block: string) => {
    const key = `${illness}__${block}`;
    setAcknowledging(key);
    try {
      await fetchWithAuth('/health/analytics/acknowledge-outbreak', {
        method: 'POST',
        body: JSON.stringify({ illness, block, note: 'Alert acknowledged — situation under monitoring.' })
      });
      toast.success(`Alert for ${illness} in ${block} has been neutralized.`);
      await fetchOutbreak();
    } catch (error) {
      console.error('Acknowledge error:', error);
      toast.error('Failed to acknowledge the alert.');
    } finally {
      setAcknowledging(null);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  useEffect(() => {
    if (activeTab === 'trends') fetchOutbreak();
  }, [activeTab, fetchOutbreak]);

  const handleLeaveAction = async (requestId: string, action: 'approve' | 'reject', note?: string) => {
    try {
      await fetchWithAuth(`/leave/verify-doctor/${requestId}`, {
        method: 'PATCH',
        body: JSON.stringify({ action, note })
      });
      setLeaveRequests(prev => prev.map(req =>
        req.id === requestId
          ? {
              ...req,
              status: action === 'approve' ? 'doctor_verified' : 'rejected',
              doctorNote: action === 'approve' ? 'Medical legitimacy verified.' : undefined,
              rejectionReason: action === 'reject' ? note : undefined
            }
          : req
      ));
      toast.success(`Leave request ${action === 'approve' ? 'verified' : 'rejected'} successfully.`);
    } catch (error) {
      console.error('Leave action error:', error);
      toast.error('Failed to process leave request.');
    }
  };

  const activeCases = allLogs.filter((l: any) => l.status === 'active');
  const closedCases = allLogs.filter((l: any) => l.status === 'closed');
  const displayedCases = caseFilter === 'active' ? activeCases : closedCases;
  const hasOutbreakAlert = outbreakData?.alerts?.some((a: any) => !a.acknowledged);

  // Build chart-ready illness keys from outbreak data
  const illnessKeys = outbreakData
    ? Object.keys(outbreakData.illnessTotals || {})
    : [];

  const CHART_COLORS = ['#ef4444', '#0d9488', '#f59e0b', '#6366f1', '#ec4899'];

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'new-log', label: 'New Health Log', icon: <FilePlus2 className="w-4 h-4" /> },
    { id: 'cases',   label: `Cases (${allLogs.length})`, icon: <Folders className="w-4 h-4" /> },
    { id: 'trends',  label: 'Trend Analysis', icon: <TrendingUp className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Doctor Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">Medical entries, case tracking, and campus health monitoring.</p>
        </div>
        {hasOutbreakAlert && (() => {
          const first = outbreakData.alerts.find((a: any) => !a.acknowledged);
          return first ? (
            <div className="flex items-center space-x-3 px-5 py-3 rounded-xl border shadow-sm bg-red-50 border-red-200 text-red-700 ring-2 ring-red-100">
              <ShieldAlert className="w-6 h-6 animate-pulse" />
              <div>
                <p className="font-bold text-sm uppercase tracking-wider">Outbreak Alert Active</p>
                <p className="text-xs font-semibold opacity-80">{first.count} {first.illness} cases in {first.block}</p>
              </div>
            </div>
          ) : null;
        })()}
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Cases', value: allLogs.length, icon: <FileText className="w-5 h-5 text-teal-600" />, color: 'teal' },
          { label: 'Active Cases', value: activeCases.length, icon: <Activity className="w-5 h-5 text-orange-500" />, color: 'orange' },
          { label: 'Closed Cases', value: closedCases.length, icon: <CheckCircle2 className="w-5 h-5 text-green-500" />, color: 'green' },
          { label: 'Pending Verifications', value: leaveRequests.filter(r => r.status === 'applied').length, icon: <Clock className="w-5 h-5 text-purple-500" />, color: 'purple' },
        ].map(stat => (
          <div key={stat.label} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">{stat.icon}</div>
            </div>
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
                  ? 'border-blue-600 text-blue-700 bg-white'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-white/50'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6 sm:p-8">
          {/* ── TAB 1: New Health Log ── */}
          {activeTab === 'new-log' && (
            <div className="space-y-8">
              <DoctorEntryForm onLogCreated={fetchLogs} />

              {/* Pending Leave Verifications */}
              <div>
                <div className="flex items-center space-x-3 mb-6 pb-4 border-b border-slate-100">
                  <div className="bg-teal-50 p-2.5 rounded-xl border border-teal-100">
                    <FileText className="w-5 h-5 text-teal-600" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-800">Pending Medical Verifications</h2>
                </div>
                <ApproverDashboard
                  role="doctor"
                  requests={leaveRequests.filter(r => r.status === 'applied')}
                  onAction={handleLeaveAction}
                />
              </div>
            </div>
          )}

          {/* ── TAB 2: Cases ── */}
          {activeTab === 'cases' && (
            <div className="space-y-6">
              {/* Active / Closed Toggle */}
              <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl w-fit">
                <button
                  onClick={() => setCaseFilter('active')}
                  className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                    caseFilter === 'active'
                      ? 'bg-white text-blue-700 shadow-sm border border-slate-200'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Active ({activeCases.length})
                </button>
                <button
                  onClick={() => setCaseFilter('closed')}
                  className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                    caseFilter === 'closed'
                      ? 'bg-white text-blue-700 shadow-sm border border-slate-200'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Closed ({closedCases.length})
                </button>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-16 text-slate-400">
                  <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading cases...
                </div>
              ) : displayedCases.length === 0 ? (
                <div className="text-center py-16 text-slate-400">
                  <Folders className="w-10 h-10 mx-auto mb-3 opacity-40" />
                  <p className="font-medium">No {caseFilter} cases found.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {displayedCases.map((log: any) => {
                    const vs = VERIFICATION_LABELS[log.verificationStatus || log.leaveStatus || 'none'];
                    const isExpanded = expandedCase === log._id;
                    return (
                      <div key={log._id} className="border border-slate-200 rounded-xl overflow-hidden hover:border-blue-200 transition-colors">
                        {/* Case Summary Row */}
                        <button
                          className="w-full text-left p-5 flex items-start justify-between gap-4 hover:bg-slate-50 transition-colors"
                          onClick={() => setExpandedCase(isExpanded ? null : log._id)}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 flex-wrap">
                              <p className="font-bold text-slate-800">{log.studentName}</p>
                              <span className="text-xs text-slate-500 font-mono">{log.studentId}</span>
                              {log.studentBlock && (
                                <span className="text-xs text-slate-500 flex items-center gap-1">
                                  <MapPin className="w-3 h-3" /> {log.studentBlock}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 mt-2 flex-wrap">
                              <span className="text-sm text-slate-600 font-medium">{log.illness}</span>
                              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${vs.color}`}>
                                {vs.label}
                              </span>
                              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                                log.status === 'active' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'
                              }`}>
                                {log.status === 'active' ? 'Under Treatment' : 'Discharged'}
                              </span>
                            </div>
                            <p className="text-xs text-slate-400 mt-1.5">
                              Logged {new Date(log.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </p>
                          </div>
                          <ChevronRight className={`w-4 h-4 text-slate-400 shrink-0 mt-1 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                        </button>

                        {/* Case History Expansion */}
                        {isExpanded && (
                          <div className="border-t border-slate-100 bg-slate-50/50 p-5">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                              <div>
                                <p className="text-xs font-bold uppercase text-slate-500 tracking-widest mb-1">Diagnosis</p>
                                <p className="text-sm text-slate-700">{log.diagnosis || '—'}</p>
                              </div>
                              <div>
                                <p className="text-xs font-bold uppercase text-slate-500 tracking-widest mb-1">Prescription</p>
                                <p className="text-sm text-slate-700">{log.prescription || '—'}</p>
                              </div>
                              {log.leaveReason && (
                                <div>
                                  <p className="text-xs font-bold uppercase text-slate-500 tracking-widest mb-1">Leave Reason</p>
                                  <p className="text-sm text-slate-700">{log.leaveReason}</p>
                                </div>
                              )}
                              {log.leaveStartDate && (
                                <div>
                                  <p className="text-xs font-bold uppercase text-slate-500 tracking-widest mb-1">Leave Period</p>
                                  <p className="text-sm text-slate-700">
                                    {new Date(log.leaveStartDate).toLocaleDateString()} → {new Date(log.leaveEndDate).toLocaleDateString()}
                                  </p>
                                </div>
                              )}
                            </div>

                            {/* Medical Verification Status Track */}
                            <div className="mb-5">
                              <p className="text-xs font-bold uppercase text-slate-500 tracking-widest mb-3">Medical Verification Status</p>
                              <div className="flex items-center gap-2 flex-wrap">
                                {[
                                  { key: 'applied', label: 'Applied' },
                                  { key: 'doctor_verified', label: 'Doctor Verified' },
                                  { key: 'proctor_approved', label: 'Proctor Approved' }
                                ].map((step, idx) => {
                                  const current = log.verificationStatus || log.leaveStatus || 'none';
                                  const order = ['none', 'applied', 'doctor_verified', 'proctor_approved'];
                                  const stepDone = order.indexOf(current) >= order.indexOf(step.key);
                                  const isRejected = current === 'rejected';
                                  return (
                                    <div key={step.key} className="flex items-center gap-2">
                                      <span className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full ${
                                        isRejected && idx === 0 && current === 'rejected'
                                          ? 'bg-red-100 text-red-700'
                                          : stepDone
                                            ? 'bg-green-100 text-green-700'
                                            : 'bg-slate-100 text-slate-400'
                                      }`}>
                                        {stepDone && !isRejected
                                          ? <CheckCircle2 className="w-3.5 h-3.5" />
                                          : isRejected
                                            ? <XCircle className="w-3.5 h-3.5 text-red-500" />
                                            : <AlertCircle className="w-3.5 h-3.5" />
                                        }
                                        {step.label}
                                      </span>
                                      {idx < 2 && <ChevronRight className="w-3.5 h-3.5 text-slate-300" />}
                                    </div>
                                  );
                                })}
                                {(log.verificationStatus === 'rejected' || log.leaveStatus === 'rejected') && (
                                  <span className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-red-100 text-red-700">
                                    <XCircle className="w-3.5 h-3.5" /> Rejected
                                  </span>
                                )}
                              </div>
                              {log.rejectionReason && (
                                <p className="text-xs text-red-600 mt-2 bg-red-50 rounded-lg px-3 py-2">
                                  Reason: {log.rejectionReason}
                                </p>
                              )}
                            </div>

                            {/* Timeline */}
                            {log.timeline?.length > 0 && (
                              <div>
                                <p className="text-xs font-bold uppercase text-slate-500 tracking-widest mb-3">Case Timeline</p>
                                <ol className="space-y-3">
                                  {log.timeline.map((entry: any, i: number) => (
                                    <li key={i} className="flex gap-3">
                                      <div className="flex flex-col items-center">
                                        <div className={`w-2.5 h-2.5 rounded-full mt-1 shrink-0 ${
                                          entry.type === 'closed' ? 'bg-slate-400' :
                                          entry.type === 'doctor_entry' ? 'bg-blue-500' : 'bg-teal-500'
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
              )}
            </div>
          )}

          {/* ── TAB 3: Trend Analysis ── */}
          {activeTab === 'trends' && (
            <div className="space-y-8">
              {outbreakLoading ? (
                <div className="flex items-center justify-center py-20 text-slate-400">
                  <Loader2 className="w-6 h-6 animate-spin mr-2" /> Analyzing campus health data...
                </div>
              ) : (
                <>
                  {/* Outbreak Alerts */}
                  {outbreakData?.alerts?.length > 0 ? (
                    <div className="space-y-3">
                      <h3 className="text-sm font-bold uppercase text-slate-500 tracking-widest flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-500" /> Outbreak Risk Alerts
                      </h3>
                      {outbreakData.alerts.map((alert: any, i: number) => {
                        const ackKey = `${alert.illness}__${alert.block}`;
                        const isAcknowledging = acknowledging === ackKey;
                        if (alert.acknowledged) {
                          return (
                            <div key={i} className="flex items-center gap-4 p-4 rounded-xl border bg-slate-50 border-slate-200 text-slate-600">
                              <BellOff className="w-5 h-5 shrink-0 text-slate-400" />
                              <div>
                                <p className="font-bold text-sm">
                                  {alert.illness.charAt(0).toUpperCase() + alert.illness.slice(1)} Alert — {alert.block}
                                  <span className="ml-2 text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-100">Neutralized</span>
                                </p>
                                <p className="text-xs mt-0.5 opacity-70">
                                  Acknowledged by {alert.acknowledgedBy} on {new Date(alert.acknowledgedAt).toLocaleString()}
                                </p>
                              </div>
                            </div>
                          );
                        }
                        return (
                          <div key={i} className={`flex items-center gap-4 p-4 rounded-xl border ${
                            alert.severity === 'critical' ? 'bg-red-50 border-red-200 text-red-800' : 'bg-orange-50 border-orange-200 text-orange-800'
                          }`}>
                            <ShieldAlert className={`w-6 h-6 shrink-0 ${alert.severity === 'critical' ? 'text-red-500 animate-pulse' : 'text-orange-500'}`} />
                            <div className="flex-1">
                              <p className="font-bold text-sm">
                                High Risk of {alert.illness.charAt(0).toUpperCase() + alert.illness.slice(1)} Outbreak — {alert.block}
                              </p>
                              <p className="text-xs mt-0.5 opacity-80">
                                {alert.count} confirmed cases in the last 7 days (threshold: {outbreakData.threshold}). Immediate attention required.
                              </p>
                            </div>
                            <div className="flex flex-col items-end gap-2 shrink-0">
                              <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                                alert.severity === 'critical' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                              }`}>
                                {alert.severity.toUpperCase()}
                              </span>
                              <button
                                onClick={() => acknowledgeAlert(alert.illness, alert.block)}
                                disabled={!!isAcknowledging}
                                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-white border border-current hover:bg-slate-50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                              >
                                {isAcknowledging
                                  ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Neutralizing...</>
                                  : <><BellOff className="w-3.5 h-3.5" /> Acknowledge & Neutralize</>
                                }
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : outbreakData && (
                    <div className="flex items-center gap-3 p-4 rounded-xl border bg-green-50 border-green-200 text-green-800">
                      <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                      <p className="text-sm font-medium">No outbreak risk detected. Campus illness levels are within normal range.</p>
                    </div>
                  )}

                  {/* Block Breakdown */}
                  {outbreakData?.blockIllnessMap && Object.keys(outbreakData.blockIllnessMap).length > 0 && (
                    <div>
                      <h3 className="text-sm font-bold uppercase text-slate-500 tracking-widest mb-4 flex items-center gap-2">
                        <MapPin className="w-4 h-4" /> Block-wise Breakdown (Last 7 Days)
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {Object.entries(outbreakData.blockIllnessMap).map(([block, illnesses]: [string, any]) => {
                          const total = Object.values(illnesses as Record<string, number>).reduce((a, b) => a + b, 0);
                          return (
                            <div key={block} className="border border-slate-200 rounded-xl p-4 bg-white">
                              <div className="flex items-center justify-between mb-3">
                                <p className="font-bold text-slate-800 text-sm">{block}</p>
                                <span className="text-xs font-semibold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full">{total} cases</span>
                              </div>
                              <div className="space-y-1.5">
                                {Object.entries(illnesses as Record<string, number>).map(([illness, count]) => (
                                  <div key={illness} className="flex items-center justify-between">
                                    <span className="text-xs text-slate-600 capitalize">{illness}</span>
                                    <div className="flex items-center gap-2">
                                      <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                          className="h-full bg-blue-500 rounded-full"
                                          style={{ width: `${Math.min(100, (count / total) * 100)}%` }}
                                        />
                                      </div>
                                      <span className="text-xs font-bold text-slate-700">{count}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Trend Chart */}
                  {outbreakData?.chartData?.length > 0 ? (
                    <div>
                      <h3 className="text-sm font-bold uppercase text-slate-500 tracking-widest mb-6 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" /> Illness Trend — Last 7 Days
                      </h3>
                      <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={outbreakData.chartData} margin={{ top: 10, right: 30, left: -20, bottom: 0 }}>
                            <defs>
                              {illnessKeys.map((key, i) => (
                                <linearGradient key={key} id={`color-${i}`} x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor={CHART_COLORS[i % CHART_COLORS.length]} stopOpacity={0.2} />
                                  <stop offset="95%" stopColor={CHART_COLORS[i % CHART_COLORS.length]} stopOpacity={0} />
                                </linearGradient>
                              ))}
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} allowDecimals={false} />
                            <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', padding: '12px' }} />
                            <Legend verticalAlign="top" height={50} iconType="circle" wrapperStyle={{ fontSize: '13px', fontWeight: 500 }} />
                            {illnessKeys.map((key, i) => (
                              <Area
                                key={key}
                                type="monotone"
                                name={key.charAt(0).toUpperCase() + key.slice(1)}
                                dataKey={key}
                                stroke={CHART_COLORS[i % CHART_COLORS.length]}
                                strokeWidth={3}
                                fillOpacity={1}
                                fill={`url(#color-${i})`}
                              />
                            ))}
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  ) : outbreakData && (
                    <div className="text-center py-12 text-slate-400">
                      <TrendingUp className="w-10 h-10 mx-auto mb-3 opacity-40" />
                      <p className="font-medium">No illness data logged in the last 7 days.</p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
