import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../../utils/api';
import Card from '../../../components/ui/Card';
import StatusBadge from '../../../components/ui/StatusBadge';

const Assets = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [note, setNote] = useState('');
  const [photos, setPhotos] = useState([]);
  const [cost, setCost] = useState('');
  const [type, setType] = useState('Repair');
  const baseUrl = api.defaults.baseURL || '';

  const resolveUrl = (url) => {
    if (!url) return '';
    if (/^https?:\/\//i.test(url)) return url;
    if (url.startsWith('/')) return `${baseUrl}${url}`;
    return `${baseUrl}/${url}`;
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/assets?includeMaintenance=1');
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
    if (!note.trim()) {
      toast.error('Please enter maintenance details.');
      return;
    }
    if (!photos || photos.length === 0) {
      toast.error('Please upload at least one photo as proof.');
      return;
    }

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
      setSelectedId(id);
      fetchData();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to add maintenance log');
    }
  };

  const selectedAsset = selectedId ? items.find((a) => a._id === selectedId) : null;

  return (
    <Card title="My Assigned Assets" subtitle="Update maintenance status and logs">
      {loading ? (
        <div className="text-gray-600">Loading…</div>
      ) : items.length === 0 ? (
        <div className="text-gray-600">No assigned assets.</div>
      ) : (
        <div className="space-y-4">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Update</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Details</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {items.map((a) => (
                <tr
                  key={a._id}
                  className={selectedId === a._id ? 'bg-blue-50' : 'hover:bg-gray-50'}
                >
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    <button
                      type="button"
                      onClick={() => setSelectedId(a._id)}
                      className="text-left hover:underline"
                    >
                      {a.name}
                    </button>
                    <div className="text-xs text-gray-500">ID: {a.assetId}</div>
                  </td>
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
                      type="button"
                      onClick={() => setSelectedId(a._id)}
                      className="px-3 py-2 rounded-lg bg-gray-900 text-white hover:bg-gray-800"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            {!selectedAsset ? (
              <div className="text-gray-600">Select an asset to view details and submit a maintenance log.</div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-lg font-semibold text-gray-900">{selectedAsset.name}</div>
                    <div className="text-sm text-gray-600">
                      ID: {selectedAsset.assetId} • Category: {selectedAsset.category} • Subcategory: {selectedAsset.subcategory}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      Address: {selectedAsset.location?.address || '-'}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      Next Inspection / Due Date:{' '}
                      {selectedAsset.nextInspectionDate
                        ? new Date(selectedAsset.nextInspectionDate).toLocaleDateString('en-IN')
                        : '-'}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-500 mb-1">Current Status</div>
                    <StatusBadge status={selectedAsset.status} />
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div>
                    <div className="font-semibold text-gray-900 mb-2">Submit Maintenance Log</div>
                    <div className="space-y-3">
                      <textarea
                        rows={4}
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Work completed / inspection details"
                      />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                      </div>
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={(e) => setPhotos(e.target.files)}
                        className="w-full"
                      />
                      <button
                        type="button"
                        onClick={() => addLog(selectedAsset._id)}
                        className="w-full px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                      >
                        Submit Log
                      </button>
                      <div className="text-xs text-gray-500">
                        Note: Proof photo upload is required to submit the log.
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="font-semibold text-gray-900 mb-2">Recent Maintenance History</div>
                    {Array.isArray(selectedAsset.maintenance?.maintenanceHistory) &&
                    selectedAsset.maintenance.maintenanceHistory.length > 0 ? (
                      <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                        {[...selectedAsset.maintenance.maintenanceHistory]
                          .slice(-10)
                          .reverse()
                          .map((log, idx) => (
                            <div key={log._id || idx} className="border border-gray-200 rounded-lg p-3">
                              <div className="text-sm font-medium text-gray-900">
                                {log.type || 'Maintenance'} •{' '}
                                {log.date ? new Date(log.date).toLocaleString('en-IN') : '-'}
                              </div>
                              <div className="text-xs text-gray-600 mt-1">
                                Technician: {log.technician?.name || '-'}
                                {log.cost !== undefined ? ` • Cost: ₹${Number(log.cost).toLocaleString('en-IN')}` : ''}
                              </div>
                              <div className="text-sm text-gray-700 mt-2 whitespace-pre-line">
                                {log.description || '-'}
                              </div>
                              {Array.isArray(log.photos) && log.photos.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-2">
                                  {log.photos.map((u, i) => (
                                    <a
                                      key={i}
                                      href={resolveUrl(u)}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="block border rounded overflow-hidden w-16 h-16 bg-gray-100"
                                    >
                                      <img
                                        src={resolveUrl(u)}
                                        alt="proof"
                                        className="w-full h-full object-cover"
                                      />
                                    </a>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                      </div>
                    ) : (
                      <div className="text-gray-600">No maintenance logs yet for this asset.</div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </Card>
  );
};

export default Assets;


