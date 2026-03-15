import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../../utils/api';
import Card from '../../../components/ui/Card';
import StatusBadge from '../../../components/ui/StatusBadge';

const Maintenance = () => {
  const [assets, setAssets] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dueDates, setDueDates] = useState({});

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [a, t] = await Promise.all([
        api.get('/api/assets'),
        api.get('/api/users/technicians'),
      ]);
      setAssets(a.data);
      setTechnicians(t.data);
    } catch (e) {
      toast.error('Failed to load maintenance data');
    } finally {
      setLoading(false);
    }
  };

  const assignInspection = async (assetId, technicianId) => {
    try {
      const nextInspectionDate = dueDates[assetId] || '';
      await api.put(`/api/assets/${assetId}`, {
        assignedTechnician: technicianId || null,
        nextInspectionDate: nextInspectionDate || undefined,
        status: technicianId ? 'Under Maintenance' : undefined,
      });
      toast.success('Inspection task updated');
      fetchAll();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to assign inspection');
    }
  };

  return (
    <div className="space-y-6">
      <Card
        title="Asset Maintenance Tasks"
        subtitle="Assign technicians and inspection due dates for assets"
      >
        {loading ? (
          <div className="text-gray-600">Loading…</div>
        ) : assets.length === 0 ? (
          <div className="text-gray-600">No assets found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Asset
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Assigned Technician
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Next Inspection / Task End Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {assets.map((a) => (
                  <tr key={a._id}>
                    <td className="px-6 py-4 text-sm">
                      <div className="font-medium text-gray-900">{a.name}</div>
                      <div className="text-xs text-gray-500">ID: {a.assetId}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{a.category}</td>
                    <td className="px-6 py-4 text-sm">
                      <StatusBadge status={a.status} />
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <select
                        value={a.assignedTechnician?._id || ''}
                        onChange={(e) => assignInspection(a._id, e.target.value)}
                        className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Not assigned</option>
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
                        value={dueDates[a._id] || (a.nextInspectionDate ? a.nextInspectionDate.slice(0, 10) : '')}
                        onChange={(e) =>
                          setDueDates((prev) => ({
                            ...prev,
                            [a._id]: e.target.value,
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
    </div>
  );
};

export default Maintenance;

