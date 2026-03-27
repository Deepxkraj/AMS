import { useEffect, useMemo, useState } from 'react';
import api from '../../../utils/api';

const resolveUrl = (url) => {
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  const base = api.defaults.baseURL || '';
  return `${base}${url.startsWith('/') ? '' : '/'}${url}`;
};

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

const TechnicianComplaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [note, setNote] = useState('');
  const [photos, setPhotos] = useState([]);
  const [status, setStatus] = useState('In Progress');
  const [saving, setSaving] = useState(false);

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

  const selected = useMemo(
    () => complaints.find((c) => c._id === selectedId) || null,
    [complaints, selectedId]
  );

  const submitLog = async (e) => {
    e.preventDefault();
    if (!selected) return;
    if (!note.trim()) {
      alert('Maintenance details are required');
      return;
    }
    if (!photos || photos.length === 0) {
      alert('Please upload at least one proof photo');
      return;
    }

    setSaving(true);
    try {
      const data = new FormData();
      data.append('description', note);
      data.append('status', status);
      Array.from(photos).forEach((p) => data.append('photos', p));

      const res = await api.post(`/api/complaints/${selected._id}/maintenance-log`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setComplaints((prev) => prev.map((c) => (c._id === selected._id ? res.data : c)));
      setNote('');
      setPhotos([]);
      setStatus('In Progress');
      alert('Maintenance log submitted');
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to submit maintenance log');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Assigned Complaints</h1>
        <p className="text-gray-600 mt-1">Select a complaint, then upload proof and details.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200 font-semibold text-gray-900">Complaints</div>
          <div className="divide-y divide-gray-200">
            {complaints.map((c) => (
              <button
                key={c._id}
                onClick={() => setSelectedId(c._id)}
                className={`w-full text-left p-4 hover:bg-gray-50 ${
                  selectedId === c._id ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="font-medium text-gray-900 truncate">{c.title}</div>
                  <StatusBadge status={c.status} />
                </div>
                <div className="text-xs text-gray-600 mt-1 truncate">{c.location?.address || '-'}</div>
                <div className="text-xs text-gray-600 mt-1">
                  End date:{' '}
                  <span className="font-medium text-gray-900">
                    {c.dueDate ? new Date(c.dueDate).toLocaleDateString() : '-'}
                  </span>
                </div>
              </button>
            ))}
            {complaints.length === 0 && <div className="p-4 text-sm text-gray-500">No assigned complaints.</div>}
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          {!selected && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-gray-600">
              Select a complaint to view details and submit proof.
            </div>
          )}

          {selected && (
            <>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">{selected.title}</h2>
                    <p className="text-sm text-gray-600 mt-1">{selected.description}</p>
                  </div>
                  <StatusBadge status={selected.status} />
                </div>
                <div className="text-sm text-gray-700">
                  <span className="font-medium">Address:</span> {selected.location?.address || '-'}
                </div>
                <div className="text-sm text-gray-700">
                  <span className="font-medium">End date:</span>{' '}
                  {selected.dueDate ? new Date(selected.dueDate).toLocaleDateString() : '-'}
                </div>
                {selected.image && (
                  <a
                    href={resolveUrl(selected.image)}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-blue-700 hover:underline"
                  >
                    View uploaded complaint image
                  </a>
                )}
              </div>

              <form onSubmit={submitLog} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Submit Maintenance Proof</h3>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Update status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="In Progress">In Progress</option>
                    <option value="Under Maintenance">Under Maintenance</option>
                    <option value="Resolved">Resolved</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Maintenance details</label>
                  <textarea
                    rows={4}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    placeholder="Describe what you did"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Proof photos</label>
                  <input
                    type="file"
                    multiple
                    accept="image/*,.heic,.heif,.webp"
                    onChange={(e) => setPhotos(e.target.files)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>

                <button
                  disabled={saving}
                  className="px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? 'Submitting...' : 'Submit'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default TechnicianComplaints;

