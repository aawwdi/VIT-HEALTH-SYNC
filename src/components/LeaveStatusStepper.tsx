import React from 'react';
import { CheckCircle2, Circle, Clock, XCircle, AlertCircle } from 'lucide-react';
import { LeaveStatus } from '../lib/mockData';

interface LeaveStatusStepperProps {
  status: LeaveStatus;
}

export default function LeaveStatusStepper({ status }: LeaveStatusStepperProps) {
  const steps = [
    { id: 'applied', label: 'Student Applied', description: 'Request submitted' },
    { id: 'doctor_verified', label: 'Medical Verification', description: 'Doctor review' },
    { id: 'proctor_approved', label: 'Academic Approval', description: 'Proctor final sign-off' },
  ];

  const getStepStatus = (stepId: string, index: number) => {
    if (status === 'rejected') {
      // If rejected, we show all steps as rejected or completed up to failure
      // Since we don't have rejection stage, let's highlight the whole path as failed
      return 'rejected';
    }

    const currentStatusIndex = steps.findIndex(s => s.id === status);
    if (index < currentStatusIndex || status === 'proctor_approved') {
      return 'completed';
    }
    if (index === currentStatusIndex) {
      return 'current';
    }
    return 'upcoming';
  };

  return (
    <div className="py-4">
      {status === 'rejected' && (
        <div className="flex justify-center mb-6">
          <span className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-bold bg-red-100 text-red-700 border-2 border-red-200 shadow-sm animate-bounce">
            <XCircle className="w-4 h-4 mr-2" />
            REJECTED
          </span>
        </div>
      )}
      <div className="relative flex justify-between">
        {/* Progress Line */}
        <div className="absolute top-5 left-0 w-full h-0.5 bg-slate-200 -z-10">
          <div 
            className={`h-full transition-all duration-500 ${
              status === 'rejected' ? 'bg-red-500 w-full' : 'bg-teal-500'
            } ${
              status === 'doctor_verified' ? 'w-1/2' : 
              status === 'proctor_approved' ? 'w-full' : 
              status === 'rejected' ? 'w-full' : 'w-0'
            }`}
          />
        </div>

        {steps.map((step, index) => {
          const stepStatus = getStepStatus(step.id, index);
          
          return (
            <div key={step.id} className="flex flex-col items-center text-center w-1/3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 bg-white transition-all duration-300 ${
                stepStatus === 'completed' ? 'border-teal-500 text-teal-500' :
                stepStatus === 'current' ? 'border-teal-500 text-teal-500 ring-4 ring-teal-50' :
                stepStatus === 'rejected' ? 'border-red-500 text-red-500 bg-red-50 shadow-[0_0_15px_rgba(239,68,68,0.2)]' :
                'border-slate-300 text-slate-300'
              }`}>
                {stepStatus === 'completed' ? <CheckCircle2 className="w-6 h-6" /> :
                 stepStatus === 'rejected' ? <XCircle className="w-6 h-6 animate-pulse" /> :
                 stepStatus === 'current' ? <Clock className="w-6 h-6" /> :
                 <Circle className="w-6 h-6" />}
              </div>
              <div className="mt-2">
                <p className={`text-[10px] font-bold uppercase tracking-widest ${
                  stepStatus === 'upcoming' ? 'text-slate-400' : 
                  stepStatus === 'rejected' ? 'text-red-600' : 'text-slate-800'
                }`}>
                  {status === 'rejected' ? (
                    <span className="flex items-center justify-center">
                      <XCircle className="w-3 h-3 mr-1" /> Rejected
                    </span>
                  ) : step.label}
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5">{step.description}</p>
              </div>
            </div>
          );
        })}
      </div>
      
      {status === 'rejected' && (
        <div className="mt-8 p-4 bg-red-50 border-2 border-red-200 rounded-xl text-red-800 text-sm flex items-start shadow-sm animate-in fade-in slide-in-from-top-2 duration-500">
          <AlertCircle className="w-5 h-5 mr-3 text-red-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-bold text-red-900 uppercase tracking-tight text-xs mb-1">Application Rejected</p>
            <p className="text-red-700 leading-relaxed">
              This medical leave request has been rejected by the authorities. Please check your notifications or contact your Proctor for more details.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

