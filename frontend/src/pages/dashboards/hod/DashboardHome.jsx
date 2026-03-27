import { useEffect, useState } from 'react';
import api from '../../../utils/api';
import { Building2, Users, CheckCircle2, MapPin, AlertCircle } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';

const DashboardHome = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    (async () => {
      try {
        setError(null);
        setStats(null);
        
        if (!user) {
          setError('No user authenticated');
          setLoading(false);
          return;
        }
        
        const token = localStorage.getItem('token');
        if (!token) {
          setError('No authentication token found');
          setLoading(false);
          return;
        }
        
        const res = await api.get('/api/dashboard/stats');
        
        if (res.data) {
          setStats(res.data);
        } else {
          setError('No data received from server');
        }
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="text-gray-600">Loading…</div>;
  
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h3 className="text-red-800 font-medium">Error loading dashboard</h3>
        <p className="text-red-600 text-sm mt-1">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Department Information Card */}
      <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-600">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Department Information</h3>
            <p className="text-sm text-gray-500 mt-1">You are the Head of Department</p>
          </div>
          <div className="bg-blue-100 p-3 rounded-lg">
            <MapPin className="w-6 h-6 text-blue-600" />
          </div>
        </div>
        <div className="mt-4">
          <p className="text-2xl font-bold text-blue-600">
            {user?.department?.name || 'Loading...'}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Department ID: {user?.department?._id || 'Loading...'}
          </p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats !== null ? [
          { title: 'Department Assets', value: stats?.departmentAssets || 0, icon: Building2, color: 'bg-blue-600' },
          { title: 'Department Complaints', value: stats?.departmentComplaints || 0, icon: AlertCircle, color: 'bg-red-600' },
          { title: 'Pending Tech Approvals', value: stats?.pendingTechnicianApprovals || 0, icon: CheckCircle2, color: 'bg-yellow-500' },
          { title: 'Technicians', value: stats?.technicians || 0, icon: Users, color: 'bg-green-600' },
        ].map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.title} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">{c.title}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{c.value}</p>
                </div>
                <div className={`${c.color} p-3 rounded-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          );
        }) : (
          <div className="col-span-full">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-800">Loading dashboard statistics...</p>
              <p className="text-yellow-600 text-sm mt-2">Please wait while we fetch your data</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardHome;


