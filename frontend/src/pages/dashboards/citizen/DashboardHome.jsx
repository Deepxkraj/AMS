import { useEffect, useState } from 'react';
import { FileText, CheckCircle2, Clock } from 'lucide-react';
import api from '../../../utils/api';

const StatCard = ({ title, value, icon: Icon }) => (
  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
      </div>
      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
        <Icon className="w-6 h-6 text-blue-600" />
      </div>
    </div>
  </div>
);

const CitizenDashboardHome = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/api/dashboard/stats');
        setStats(res.data);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Citizen Dashboard</h1>
        <p className="text-gray-600 mt-1">Track your complaints status.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="My Complaints" value={stats?.myComplaints ?? 0} icon={FileText} />
        <StatCard title="Pending" value={stats?.pendingComplaints ?? 0} icon={Clock} />
        <StatCard title="Resolved" value={stats?.resolvedComplaints ?? 0} icon={CheckCircle2} />
      </div>
    </div>
  );
};

export default CitizenDashboardHome;

