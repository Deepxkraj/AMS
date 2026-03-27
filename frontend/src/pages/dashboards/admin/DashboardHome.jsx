import { useEffect, useState } from 'react';
import api from '../../../utils/api';
import { Building2, Users, CheckCircle2, AlertCircle } from 'lucide-react';

const DashboardHome = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  // Refresh stats when navigating back to dashboard or when statsRefresh event fires
  useEffect(() => {
    const handleStatsRefresh = () => {
      fetchStats();
    };
    
    window.addEventListener('statsRefresh', handleStatsRefresh);
    
    return () => {
      window.removeEventListener('statsRefresh', handleStatsRefresh);
    };
  }, []);

  const fetchStats = async () => {
    try {
      const response = await api.get('/api/dashboard/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  const statCards = [
    {
      title: 'Total Assets',
      value: stats?.totalAssets || 0,
      icon: Building2,
      color: 'bg-blue-500'
    },
    {
      title: 'Total Complaints',
      value: stats?.totalComplaints || 0,
      icon: AlertCircle,
      color: 'bg-red-500'
    },
    {
      title: 'Pending Approvals',
      value: stats?.pendingApprovals || 0,
      icon: CheckCircle2,
      color: 'bg-yellow-500'
    },
    {
      title: 'Departments',
      value: stats?.totalDepartments || 0,
      icon: Users,
      color: 'bg-green-500'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.title} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">{card.title}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{card.value}</p>
                </div>
                <div className={`${card.color} p-3 rounded-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Assets by Status</h3>
          <div className="space-y-3">
            {stats?.assetsByStatus?.map((item) => (
              <div key={item._id} className="flex items-center justify-between">
                <span className="text-gray-600 capitalize">{item._id}</span>
                <span className="font-semibold text-gray-900">{item.count}</span>
              </div>
            )) || <p className="text-gray-500">No data available</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;

