import { useAuth } from '../../context/AuthContext';
import { LogOut } from 'lucide-react';

const Header = () => {
  const { user, logout } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {user?.role === 'admin' && 'Admin Dashboard'}
            {user?.role === 'department_head' && 'Department Head Dashboard'}
            {user?.role === 'technician' && 'Technician Dashboard'}
            {user?.role === 'citizen' && 'Citizen Portal'}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Welcome back, {user?.name}
            {user?.role === 'department_head' && user?.department && (
              <span className="ml-2 font-medium text-blue-600">
                • {user.department.name} Department
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={logout}
            className="hidden sm:inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
          <div className="text-right">
            <p className="text-sm font-medium text-gray-900">{user?.name}</p>
            <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
          </div>
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
            <span className="text-white font-semibold">
              {user?.name?.charAt(0).toUpperCase()}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;

