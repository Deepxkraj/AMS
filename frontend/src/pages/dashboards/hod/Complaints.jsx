import { useEffect, useMemo, useState } from 'react';
import api from '../../../utils/api';

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

const HODComplaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setError('');
        const [complaintsRes, techRes] = await Promise.allSettled([
          api.get('/api/complaints'),
          api.get('/api/users/technicians')
        ]);

        if (complaintsRes.status === 'fulfilled') {
          setComplaints(complaintsRes.value.data || []);
        } else {
          setComplaints([]);
          setError(complaintsRes.reason?.response?.data?.message || 'Failed to load complaints');
        }

        if (techRes.status === 'fulfilled') {
          setTechnicians(techRes.value.data || []);
        } else {
          setTechnicians([]);
          // Keep page usable even if technician fetch fails.
          setError((prev) => prev || 'Failed to load technicians');
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const technicianOptions = useMemo(() => technicians, [technicians]);

  const assign = async (complaintId, assignedTo, dueDate) => {
    setSavingId(complaintId);
    try {
      const res = await api.put(`/api/complaints/${complaintId}/assign`, {
        assignedTo,
        dueDate: dueDate || undefined
      });
      setComplaints((prev) => prev.map((c) => (c._id === complaintId ? res.data : c)));
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to assign complaint');
    } finally {
      setSavingId(null);
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Complaints</h1>
        <p className="text-gray-600 mt-1">Assign complaints to technicians (with end date).</p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Citizen
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assign Technician
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  End Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {complaints.map((c) => (
                <ComplaintRow
                  key={c._id}
                  complaint={c}
                  technicians={technicianOptions}
                  onAssign={assign}
                  saving={savingId === c._id}
                />
              ))}
              {complaints.length === 0 && (
                <tr>
                  <td className="px-6 py-8 text-sm text-gray-500" colSpan={6}>
                    No complaints found.
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

const ComplaintRow = ({ complaint, technicians, onAssign, saving }) => {
  const [assignedTo, setAssignedTo] = useState(complaint.assignedTo?._id || '');
  const [dueDate, setDueDate] = useState(
    complaint.dueDate ? new Date(complaint.dueDate).toISOString().slice(0, 10) : ''
  );
  const isCompleted = complaint.status === 'Resolved';
  const isOverdue =
    Boolean(complaint.dueDate) &&
    !isCompleted &&
    new Date(complaint.dueDate).getTime() < new Date().setHours(0, 0, 0, 0);

  return (
    <tr className={`hover:bg-gray-50 ${isOverdue ? 'bg-red-50' : ''}`}>
      <td className="px-6 py-4 text-sm font-medium text-gray-900">{complaint.title}</td>
      <td className="px-6 py-4 text-sm text-gray-700">{complaint.citizen?.name || '-'}</td>
      <td className="px-6 py-4 text-sm">
        <div className="flex flex-col gap-1">
          <StatusBadge status={complaint.status} />
          {isOverdue && (
            <span className="text-xs font-semibold text-red-700">
              Not completed (overdue)
            </span>
          )}
        </div>
      </td>
      <td className="px-6 py-4 text-sm">
        <select
          value={assignedTo}
          onChange={(e) => setAssignedTo(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
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
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className={`w-full px-3 py-2 border rounded-lg ${
            isOverdue ? 'border-red-400 bg-red-50 text-red-700' : 'border-gray-300'
          }`}
        />
      </td>
      <td className="px-6 py-4 text-sm">
        <button
          disabled={!assignedTo || saving}
          onClick={() => onAssign(complaint._id, assignedTo, dueDate)}
          className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Assign'}
        </button>
      </td>
    </tr>
  );
};

export default HODComplaints;

