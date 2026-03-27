import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../../utils/api';
import Card from '../../../components/ui/Card';

const Departments = () => {
  const [items, setItems] = useState([]);
  const [assetsByDept, setAssetsByDept] = useState({});
  const [complaintsByDept, setComplaintsByDept] = useState({});
  const [selectedDeptId, setSelectedDeptId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [dRes, aRes, cRes] = await Promise.all([
        api.get('/api/departments'),
        api.get('/api/assets'),
        api.get('/api/complaints'),
      ]);
      setItems(dRes.data);

      const grouped = {};
      (aRes.data || []).forEach((a) => {
        const deptId = a.department?._id || a.department;
        if (!deptId) return;
        if (!grouped[deptId]) grouped[deptId] = [];
        grouped[deptId].push(a);
      });
      setAssetsByDept(grouped);

      const groupedComplaints = {};
      (cRes.data || []).forEach((c) => {
        const deptId = c.department?._id || c.department;
        if (!deptId) return;
        if (!groupedComplaints[deptId]) groupedComplaints[deptId] = [];
        groupedComplaints[deptId].push(c);
      });
      setComplaintsByDept(groupedComplaints);

      if (!selectedDeptId && dRes.data?.length) {
        setSelectedDeptId(dRes.data[0]._id);
      }
    } catch (e) {
      toast.error('Failed to load departments');
    } finally {
      setLoading(false);
    }
  };

  const create = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/departments', { name, description });
      toast.success('Department created');
      setName('');
      setDescription('');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create department');
    }
  };

  const selectedDept = items.find((d) => d._id === selectedDeptId) || null;
  const selectedDeptAssets = selectedDept ? (assetsByDept[selectedDept._id] || []) : [];
  const selectedDeptComplaints = selectedDept ? (complaintsByDept[selectedDept._id] || []) : [];

  return (
    <div className="space-y-6">
      <Card
        title="Departments"
        subtitle="Manage municipal departments"
        right={
          <div className="text-sm text-gray-600">
            Total: <span className="font-semibold">{items.length}</span>
          </div>
        }
      >
        <form onSubmit={create} className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Department name"
          />
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Description (optional)"
          />
          <button className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700">
            Add Department
          </button>
        </form>

        {loading ? (
          <div className="text-gray-600">Loading…</div>
        ) : items.length === 0 ? (
          <div className="text-gray-600">No departments yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">HOD</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assets</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Complaints</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {items.map((d) => {
                  const deptAssets = assetsByDept[d._id] || [];
                  const deptComplaints = complaintsByDept[d._id] || [];
                  const isSelected = selectedDeptId === d._id;
                  return (
                    <tr
                      key={d._id}
                      className={`align-top cursor-pointer ${isSelected ? 'bg-blue-50' : ''}`}
                      onClick={() => setSelectedDeptId(d._id)}
                    >
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{d.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{d.description || '-'}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{d.hod?.name || '-'}</td>
                      <td className="px-6 py-4 text-sm">
                        {deptAssets.length} {deptAssets.length === 1 ? 'asset' : 'assets'}
                      </td>
                      <td className="px-6 py-4 text-sm">{deptComplaints.length}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {selectedDept && (
        <Card
          title={`${selectedDept.name} - Details`}
          subtitle="Assets and complaints are shown directly on this page"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="px-4 py-3 bg-gray-50 font-semibold text-gray-900">
                Assets ({selectedDeptAssets.length})
              </div>
              {selectedDeptAssets.length === 0 ? (
                <div className="p-4 text-sm text-gray-600">No assets for this department.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Asset</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Assigned</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Next Inspection</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {selectedDeptAssets.map((a) => (
                        <tr key={a._id}>
                          <td className="px-3 py-2 text-sm text-gray-900">
                            <div className="font-medium">{a.name}</div>
                            <div className="text-xs text-gray-500">ID: {a.assetId}</div>
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-700">{a.status}</td>
                          <td className="px-3 py-2 text-sm text-gray-700">{a.assignedTechnician?.name || '-'}</td>
                          <td className="px-3 py-2 text-sm text-gray-700">
                            {a.nextInspectionDate ? new Date(a.nextInspectionDate).toLocaleDateString('en-IN') : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="px-4 py-3 bg-gray-50 font-semibold text-gray-900">
                Complaints ({selectedDeptComplaints.length})
              </div>
              {selectedDeptComplaints.length === 0 ? (
                <div className="p-4 text-sm text-gray-600">No complaints for this department.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Citizen</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {selectedDeptComplaints.map((c) => (
                        <tr key={c._id}>
                          <td className="px-3 py-2 text-sm text-gray-900">{c.title}</td>
                          <td className="px-3 py-2 text-sm text-gray-700">{c.status}</td>
                          <td className="px-3 py-2 text-sm text-gray-700">{c.citizen?.name || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default Departments;


