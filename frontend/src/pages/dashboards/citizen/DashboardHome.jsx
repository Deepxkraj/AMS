import { useEffect, useState } from 'react';
import api from '../../../utils/api';
import { AlertCircle, CheckCircle2, FileText } from 'lucide-react';

const DashboardHome = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/api/dashboard/stats');
        setStats(res.data);
      } catch (error) {
        console.error('Error fetching citizen stats:', error);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="text-gray-600">Loading…</div>;

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="text-red-800">
          <h3 className="font-semibold">Error Loading Dashboard</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  const cards = [
    { title: 'My Complaints', value: stats?.myComplaints || 0, icon: FileText, color: 'bg-blue-600' },
    { title: 'Pending', value: stats?.pendingComplaints || 0, icon: AlertCircle, color: 'bg-yellow-500' },
    { title: 'Resolved', value: stats?.resolvedComplaints || 0, icon: CheckCircle2, color: 'bg-green-600' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {cards.map((c) => {
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
      })}
    </div>
  );
};

export default DashboardHome;


