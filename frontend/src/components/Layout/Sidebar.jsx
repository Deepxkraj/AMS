import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  Wrench,
  Settings,
  LogOut,
  Building2,
  CheckCircle2,
  FileText,
  AlertCircle,
  MapPin
} from 'lucide-react';

const Sidebar = () => {
  const { user, logout } = useAuth();

  if (!user) {
    return null;
  }

  const menuItems = {
    admin: [
      { path: '/admin', label: 'Dashboard', icon: LayoutDashboard },
      { path: '/admin/approvals', label: 'Approvals', icon: CheckCircle2 },
      { path: '/admin/assets', label: 'Assets', icon: Building2 },
      { path: '/admin/complaints', label: 'Complaints', icon: AlertCircle },
      { path: '/admin/departments', label: 'Departments', icon: Settings },
      { path: '/admin/users', label: 'Users', icon: Users },
    ],
    department_head: [
      { path: '/hod', label: 'Dashboard', icon: LayoutDashboard },
      { path: '/hod/approvals', label: 'Technician Approvals', icon: CheckCircle2 },
      { path: '/hod/assets', label: 'Assets', icon: Building2 },
      { path: '/hod/complaints', label: 'Complaints', icon: AlertCircle },
      { path: '/hod/maintenance', label: 'Maintenance', icon: Wrench },
      { path: '/hod/completed-tasks', label: 'Completed Tasks', icon: CheckCircle2 },
      { path: '/hod/technicians', label: 'Technicians', icon: Users },
    ],
    technician: [
      { path: '/technician', label: 'Dashboard', icon: LayoutDashboard },
      { path: '/technician/assets', label: 'My Assets', icon: Building2 },
      { path: '/technician/complaints', label: 'Complaints', icon: AlertCircle },
      { path: '/technician/completed-tasks', label: 'Completed Tasks', icon: CheckCircle2 },
    ],
    citizen: [
      { path: '/citizen', label: 'Dashboard', icon: LayoutDashboard },
      { path: '/citizen/complaints', label: 'My Complaints', icon: FileText },
      { path: '/citizen/new-complaint', label: 'New Complaint', icon: MapPin },
    ],
  };

  const items = menuItems[user?.role] || [];

  return (
    <div className="w-64 bg-gray-900 text-white min-h-screen flex flex-col">
      <div className="p-6 border-b border-gray-800">
        <h1 className="text-xl font-bold text-blue-400">AMS</h1>
        <p className="text-sm text-gray-400 mt-1">Asset Management</p>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {items.map((item) => {
          const Icon = item.icon;
          const isRoot =
            item.path === '/admin' ||
            item.path === '/hod' ||
            item.path === '/technician' ||
            item.path === '/citizen';
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={isRoot}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`
              }
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-800">
        <div className="flex items-center space-x-3 px-4 py-3 mb-2">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
            <span className="text-sm font-semibold">
              {user?.name?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.name}</p>
            <p className="text-xs text-gray-400 truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;

