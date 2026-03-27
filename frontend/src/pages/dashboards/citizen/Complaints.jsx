import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../../utils/api';
import { Plus } from 'lucide-react';

const StatusBadge = ({ status }) => {
  const cls =
    status === 'Resolved'
      ? 'bg-green-100 text-green-800'
      : status === 'In Progress' || status === 'Under Maintenance'
        ? 'bg-blue-100 text-blue-800'
        : status === 'Assigned'
          ? 'bg-yellow-100 text-yellow-800'
          : 'bg-gray-100 text-gray-800';
  return <span className={`px-2 py-1 rounded-full text-xs font-medium ${cls}`}>{status}</span>;
};

const CitizenComplaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/api/complaints');
        setComplaints(res.data || []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const rows = useMemo(() => complaints, [complaints]);

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Complaints</h1>
          <p className="text-gray-600 mt-1">View all complaints you submitted.</p>
        </div>
        <Link
          to="/citizen/new-complaint"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          New Complaint
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {rows.map((c) => (
                <tr key={c._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{c.title}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{c.category}</td>
                  <td className="px-6 py-4 text-sm">
                    <StatusBadge status={c.status} />
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '-'}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td className="px-6 py-8 text-sm text-gray-500" colSpan={4}>
                    No complaints yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CitizenComplaints;

