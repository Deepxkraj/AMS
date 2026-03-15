import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../../utils/api';
import Card from '../../../components/ui/Card';
import StatusBadge from '../../../components/ui/StatusBadge';

const Complaints = () => {
  const [items, setItems] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dueDates, setDueDates] = useState({});

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [c, t] = await Promise.all([api.get('/api/complaints'), api.get('/api/users/technicians')]);
      setItems(c.data);
      setTechnicians(t.data);
    } catch (e) {
      toast.error('Failed to load complaints');
    } finally {
      setLoading(false);
    }
  };

  const assign = async (id, assignedTo) => {
    try {
      const dueDate = dueDates[id] || '';
      await api.put(`/api/complaints/${id}/assign`, { assignedTo, dueDate: dueDate || undefined });
      toast.success('Assigned');
      fetchAll();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to assign');
    }
  };

  return (
    <Card title="Department Complaints" subtitle="Assign complaints to technicians and track progress">
      {loading ? (
        <div className="text-gray-600">Loading…</div>
      ) : items.length === 0 ? (
        <div className="text-gray-600">No complaints found.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Asset</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Urgency</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Technician</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Task End Date</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {items.map((c) => (
                <tr key={c._id}>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{c.title}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{c.asset?.name || 'N/A'}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{c.urgency}</td>
                  <td className="px-6 py-4 text-sm">
                    <StatusBadge status={c.status} />
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <select
                      value={c.assignedTo?._id || ''}
                      onChange={(e) => assign(c._id, e.target.value)}
                      className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select technician</option>
                      {technicians.map((t) => (
                        <option key={t._id} value={t._id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <input
                      type="date"
                      value={dueDates[c._id] || (c.dueDate ? c.dueDate.slice(0, 10) : '')}
                      onChange={(e) =>
                        setDueDates((prev) => ({
                          ...prev,
                          [c._id]: e.target.value,
                        }))
                      }
                      className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
};

export default Complaints;


