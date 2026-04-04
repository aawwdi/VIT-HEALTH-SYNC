import { TimelineEvent } from '../lib/mockData';
import { Stethoscope, User, CheckCircle2, AlertCircle } from 'lucide-react';

interface HealthTimelineProps {
  events: TimelineEvent[];
}

export default function HealthTimeline({ events }: HealthTimelineProps) {
  return (
    <div className="relative border-l-2 border-slate-200 ml-4 space-y-8 py-2">
      {events.map((event, index) => {
        const isLast = index === events.length - 1;
        
        let Icon = User;
        let iconBg = 'bg-slate-100';
        let iconColor = 'text-slate-500';
        
        if (event.type === 'doctor_entry') {
          Icon = Stethoscope;
          iconBg = 'bg-blue-100';
          iconColor = 'text-blue-600';
        } else if (event.type === 'closed') {
          Icon = CheckCircle2;
          iconBg = 'bg-green-100';
          iconColor = 'text-green-600';
        } else if (event.isCritical) {
          Icon = AlertCircle;
          iconBg = 'bg-red-100';
          iconColor = 'text-red-600';
        }

        return (
          <div key={event.id} className="relative pl-8">
            {/* Timeline Dot */}
            <div className={`absolute -left-[17px] top-1 w-8 h-8 rounded-full flex items-center justify-center border-4 border-white shadow-sm ${iconBg} ${iconColor}`}>
              <Icon className="w-4 h-4" />
            </div>

            {/* Content Card */}
            <div className={`bg-white p-4 rounded-xl border shadow-sm ${event.isCritical ? 'border-red-200 bg-red-50/30' : 'border-slate-200'}`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-1">
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-slate-800 text-sm">{event.author}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                    {event.type === 'doctor_entry' ? 'Doctor Entry' : event.type === 'closed' ? 'Log Closed' : 'Student Update'}
                  </span>
                </div>
                <span className="text-xs text-slate-500 font-medium">
                  {new Date(event.date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                </span>
              </div>
              
              <p className={`text-sm ${event.isCritical ? 'text-red-700 font-medium' : 'text-slate-600'}`}>
                {event.note}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
