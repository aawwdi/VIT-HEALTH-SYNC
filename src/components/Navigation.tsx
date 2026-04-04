import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Activity, ShieldAlert, Users, Stethoscope, LogOut } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface NavigationProps {
  userRole: string | null;
  setUserRole: (role: string | null) => void;
}

export default function Navigation({ userRole, setUserRole }: NavigationProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUserRole(null);
    navigate('/login');
  };

  return (
    <nav className="bg-blue-600 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
            <ShieldAlert className="w-8 h-8 text-red-400" />
            <span className="font-bold text-xl tracking-tight">VIT-HEALTH</span>
          </div>
          <div className="flex space-x-4 items-center">
            {userRole === 'student' && (
              <Link
                to="/student"
                className={cn(
                  'flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                  location.pathname === '/student'
                    ? 'bg-blue-700 text-white'
                    : 'text-blue-100 hover:bg-blue-500 hover:text-white'
                )}
              >
                <Activity className="w-4 h-4" />
                <span className="hidden sm:inline">Student Portal</span>
              </Link>
            )}
            
            {userRole === 'doctor' && (
              <Link
                to="/doctor"
                className={cn(
                  'flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                  location.pathname === '/doctor'
                    ? 'bg-blue-700 text-white'
                    : 'text-blue-100 hover:bg-blue-500 hover:text-white'
                )}
              >
                <Stethoscope className="w-4 h-4" />
                <span className="hidden sm:inline">Doctor Dashboard</span>
              </Link>
            )}

            {(userRole === 'parent' || userRole === 'faculty') && (
              <Link
                to={`/${userRole}`}
                className={cn(
                  'flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                  location.pathname === `/${userRole}`
                    ? 'bg-blue-700 text-white'
                    : 'text-blue-100 hover:bg-blue-500 hover:text-white'
                )}
              >
                <Users className="w-4 h-4" />
                <span className="hidden sm:inline">
                  {userRole === 'parent' ? 'Parent Portal' : 'Faculty Portal'}
                </span>
              </Link>
            )}

            {userRole && (
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-blue-100 hover:bg-blue-500 hover:text-white transition-colors ml-2"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
