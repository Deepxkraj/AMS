import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../../utils/api';
import Card from '../../../components/ui/Card';
import StatusBadge from '../../../components/ui/StatusBadge';

const statusOptions = ['Assigned', 'In Progress', 'Under Maintenance', 'Resolved'];

const Complaints = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState('');
  const [photos, setPhotos] = useState([]);
  const [status, setStatus] = useState('In Progress');
  const [activeId, setActiveId] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/complaints');
      setItems(res.data);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, nextStatus) => {
    try {
      await api.put(`/api/complaints/${id}/status`, { status: nextStatus });
      toast.success('Status updated');
      fetchData();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to update status');
    }
  };

  const addLog = async (id) => {
    const fd = new FormData();
    fd.append('description', note);
    fd.append('status', status);
    Array.from(photos || []).forEach((p) => fd.append('photos', p));

    try {
      await api.post(`/api/complaints/${id}/maintenance-log`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Maintenance log added');
      setNote('');
      setPhotos([]);
      setActiveId(null);
      fetchData();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to add maintenance log');
    }
  };

  return (
    <Card title="My Complaints" subtitle="Update complaint status and upload repair photos">
      {loading ? (
        <div className="text-gray-600">Loading…</div>
      ) : items.length === 0 ? (
        <div className="text-gray-600">No assigned complaints.</div>
      ) : (
        <div className="space-y-4">
          {items.map((c) => (
            <div key={c._id} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <div className="text-base font-semibold text-gray-900">{c.title}</div>
                  <div className="text-sm text-gray-600 mt-1">
                    Asset: {c.asset?.name || 'N/A'} • Urgency: {c.urgency}
                  </div>
                  {c.dueDate && (
                    <div className="text-xs mt-1">
                      <span className="font-semibold">Task End Date:</span>{' '}
                      {new Date(c.dueDate).toLocaleDateString('en-IN')}
                    </div>
                  )}
                  {c.dueDate && new Date(c.dueDate) < new Date() && c.status !== 'Resolved' && (
                    <div className="text-xs text-red-600 mt-1">
                      This task is past the end date. Please update status and submit completion proof.
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={c.status} />
                  <select
                    value={c.status}
                    onChange={(e) => updateStatus(c._id, e.target.value)}
                    className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {statusOptions.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => setActiveId((prev) => (prev === c._id ? null : c._id))}
                    className="px-3 py-2 rounded-lg bg-gray-900 text-white hover:bg-gray-800"
                  >
                    Add Log
                  </button>
                </div>
              </div>

              {activeId === c._id && (
                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                  <textarea
                    rows={3}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="md:col-span-2 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Maintenance notes"
                  />
                  <div className="space-y-2">
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {statusOptions.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(e) => setPhotos(e.target.files)}
                      className="w-full"
                    />
                    <button
                      onClick={() => addLog(c._id)}
                      className="w-full px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                    >
                      Submit Log
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};

export default Complaints;


