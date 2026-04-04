import React, { useState } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertCircle, 
  FileText, 
  User, 
  Calendar, 
  Search,
  ChevronRight,
  MessageSquare
} from 'lucide-react';
import { toast } from 'sonner';
import { MedicalLeaveRequest, LeaveStatus } from '../lib/mockData';

interface ApproverDashboardProps {
  role: 'doctor' | 'proctor';
  requests: MedicalLeaveRequest[];
  onAction: (requestId: string, action: 'approve' | 'reject', note?: string) => void;
}

export default function ApproverDashboard({ role, requests, onAction }: ApproverDashboardProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<MedicalLeaveRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectionModal, setShowRejectionModal] = useState(false);

  const filteredRequests = requests.filter(r => 
    r.studentName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    r.studentRegNo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAction = (request: MedicalLeaveRequest, action: 'approve' | 'reject') => {
    if (action === 'reject') {
      setSelectedRequest(request);
      setShowRejectionModal(true);
      return;
    }
    onAction(request.id, 'approve');
  };

  const submitRejection = () => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a reason for rejection.');
      return;
    }
    if (selectedRequest) {
      onAction(selectedRequest.id, 'reject', rejectionReason);
      setShowRejectionModal(false);
      setRejectionReason('');
      setSelectedRequest(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative max-w-md w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md leading-5 bg-white placeholder-slate-500 focus:outline-none focus:placeholder-slate-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Search by student name or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex space-x-2 text-sm">
            <span className="flex items-center text-slate-500"><div className="w-2 h-2 rounded-full bg-blue-500 mr-1"></div> Applied</span>
            <span className="flex items-center text-slate-500"><div className="w-2 h-2 rounded-full bg-orange-500 mr-1"></div> Verified</span>
            <span className="flex items-center text-slate-500"><div className="w-2 h-2 rounded-full bg-green-500 mr-1"></div> Approved</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Student</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Duration</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {filteredRequests.map((request) => {
                const isDoctorVerified = request.status === 'doctor_verified' || request.status === 'proctor_approved';
                const isProctorApproved = request.status === 'proctor_approved';
                const isRejected = request.status === 'rejected';

                // Proctor can only approve if doctor verified
                const canProctorApprove = role === 'proctor' && isDoctorVerified && !isProctorApproved && !isRejected;
                const canDoctorVerify = role === 'doctor' && request.status === 'applied' && !isRejected;

                return (
                  <tr key={request.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <User className="h-10 w-10 text-slate-300" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-slate-900">{request.studentName}</div>
                          <div className="text-sm text-slate-500">{request.studentRegNo}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-900 flex items-center">
                        <Calendar className="w-4 h-4 mr-1 text-slate-400" />
                        {request.startDate} to {request.endDate}
                      </div>
                      <div className="text-xs text-slate-500 mt-1">Applied: {new Date(request.appliedDate).toLocaleDateString()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col space-y-1">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          isRejected ? 'bg-red-100 text-red-800' :
                          isProctorApproved ? 'bg-green-100 text-green-800' :
                          isDoctorVerified ? 'bg-orange-100 text-orange-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {isRejected ? 'Rejected' :
                           isProctorApproved ? 'Approved' :
                           isDoctorVerified ? 'Verified by Doctor' :
                           'Pending Verification'}
                        </span>
                        {isDoctorVerified && role === 'proctor' && !isProctorApproved && !isRejected && (
                          <span className="text-[10px] text-green-600 font-bold uppercase tracking-tighter">Ready for Proctor Approval</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        {role === 'doctor' && (
                          <>
                            <button
                              disabled={!canDoctorVerify}
                              onClick={() => handleAction(request, 'approve')}
                              className={`px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all ${
                                canDoctorVerify 
                                  ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm' 
                                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                              }`}
                            >
                              {isDoctorVerified ? 'Verified' : 'Verify Legitimacy'}
                            </button>
                            {!isDoctorVerified && !isRejected && (
                              <button
                                onClick={() => handleAction(request, 'reject')}
                                className="px-3 py-1.5 border border-red-200 text-red-600 rounded-md text-xs font-bold uppercase tracking-wider hover:bg-red-50 transition-all"
                              >
                                Reject
                              </button>
                            )}
                          </>
                        )}

                        {role === 'proctor' && (
                          <>
                            <div className="relative group">
                              <button
                                disabled={!canProctorApprove}
                                onClick={() => handleAction(request, 'approve')}
                                className={`px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all ${
                                  canProctorApprove 
                                    ? 'bg-green-600 text-white hover:bg-green-700 shadow-sm' 
                                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                }`}
                              >
                                {isProctorApproved ? 'Approved' : 'Approve Leave'}
                              </button>
                              {!canProctorApprove && !isProctorApproved && !isRejected && (
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                                  Waiting for Medical Verification
                                </div>
                              )}
                            </div>
                            {!isProctorApproved && !isRejected && (
                              <button
                                onClick={() => handleAction(request, 'reject')}
                                className="px-3 py-1.5 border border-red-200 text-red-600 rounded-md text-xs font-bold uppercase tracking-wider hover:bg-red-50 transition-all"
                              >
                                Reject
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredRequests.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-sm text-slate-500">
                    No pending leave requests found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Rejection Modal */}
      {showRejectionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800 flex items-center">
                <AlertCircle className="w-5 h-5 mr-2 text-red-500" />
                Reject Leave Request
              </h3>
              <button 
                onClick={() => setShowRejectionModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <p className="text-sm text-slate-600">
                  Student: <span className="font-bold text-slate-800">{selectedRequest?.studentName}</span>
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Reason: {selectedRequest?.reason}
                </p>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Reason for Rejection (Mandatory)</label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none resize-none"
                  rows={4}
                  placeholder="Explain why this request is being rejected..."
                  required
                ></textarea>
              </div>
            </div>
            <div className="p-6 bg-slate-50 flex space-x-3">
              <button
                onClick={() => setShowRejectionModal(false)}
                className="flex-1 px-4 py-2.5 border border-slate-300 rounded-lg font-medium text-slate-700 hover:bg-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={submitRejection}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition-colors shadow-sm"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
