import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../../utils/api';
import Card from '../../../components/ui/Card';
import StatusBadge from '../../../components/ui/StatusBadge';

const Assets = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState(null);
  const [note, setNote] = useState('');
  const [photos, setPhotos] = useState([]);
  const [cost, setCost] = useState('');
  const [type, setType] = useState('Repair');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/assets');
      setItems(res.data);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await api.put(`/api/assets/${id}`, { status });
      toast.success('Status updated');
      fetchData();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to update');
    }
  };

  const addLog = async (id) => {
    const fd = new FormData();
    fd.append('description', note);
    fd.append('type', type);
    if (cost) {
      fd.append('cost', cost);
    }
    Array.from(photos || []).forEach((p) => fd.append('photos', p));

    try {
      await api.post(`/api/assets/${id}/maintenance-log`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Maintenance log added');
      setNote('');
      setPhotos([]);
      setCost('');
      setActiveId(null);
      fetchData();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to add maintenance log');
    }
  };

  return (
    <Card title="My Assigned Assets" subtitle="Update maintenance status and logs">
      {loading ? (
        <div className="text-gray-600">Loading…</div>
      ) : items.length === 0 ? (
        <div className="text-gray-600">No assigned assets.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Update</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Log</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {items.map((a) => (
                <tr key={a._id}>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{a.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{a.category}</td>
                  <td className="px-6 py-4 text-sm">
                    <StatusBadge status={a.status} />
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <select
                      value={a.status}
                      onChange={(e) => updateStatus(a._id, e.target.value)}
                      className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {['Safe', 'Under Maintenance', 'Damaged', 'Recently Repaired'].map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <button
                      onClick={() => setActiveId((prev) => (prev === a._id ? null : a._id))}
                      className="px-3 py-2 rounded-lg bg-gray-900 text-white hover:bg-gray-800"
                    >
                      Add Log
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {items.map(
            (a) =>
              activeId === a._id && (
                <div key={`${a._id}-log`} className="border-t border-gray-200 p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                  <textarea
                    rows={3}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="md:col-span-2 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Maintenance details for this asset"
                  />
                  <div className="space-y-2">
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {['Inspection', 'Repair', 'Replacement', 'Preventive'].map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      value={cost}
                      onChange={(e) => setCost(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Cost (optional)"
                    />
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(e) => setPhotos(e.target.files)}
                      className="w-full"
                    />
                    <button
                      onClick={() => addLog(a._id)}
                      className="w-full px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                    >
                      Submit Log
                    </button>
                  </div>
                </div>
              ),
          )}
        </div>
      )}
    </Card>
  );
};

export default Assets;


