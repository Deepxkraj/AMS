import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../utils/api';
import { Upload } from 'lucide-react';

const NewComplaint = () => {
  const navigate = useNavigate();
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState(null);

  const [form, setForm] = useState({
    title: '',
    description: '',
    urgency: 'Medium',
    department: '',
    address: ''
  });

  useEffect(() => {
    const loadDepartments = async () => {
      try {
        const deptRes = await api.get('/api/departments');
        setDepartments(deptRes.data || []);
      } catch {
        setDepartments([]);
      }
    };
    loadDepartments();
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = new FormData();
      data.append('title', form.title);
      data.append('description', form.description);
      data.append('category', 'Maintenance');
      data.append('urgency', form.urgency);
      data.append('department', form.department);
      data.append('address', form.address);
      if (image) data.append('image', image);

      await api.post('/api/complaints', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      navigate('/citizen/complaints');
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to submit complaint');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">New Complaint</h1>
        <p className="text-gray-600 mt-1">
          Fill a few simple details and submit your complaint.
        </p>
      </div>

      <form onSubmit={submit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
            <input
              required
              value={form.title}
              onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Short title"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              required
              rows={4}
              value={form.description}
              onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Explain the issue"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Urgency</label>
            <select
              value={form.urgency}
              onChange={(e) => setForm((s) => ({ ...s, urgency: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
            <select
              required
              value={form.department}
              onChange={(e) => setForm((s) => ({ ...s, department: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select department</option>
              {departments.map((dept) => (
                <option key={dept._id} value={dept._id}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Address / Landmark</label>
            <input
              required
              value={form.address}
              onChange={(e) => setForm((s) => ({ ...s, address: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter address or nearby landmark"
            />
          </div>
        </div>

        <div className="border-t border-gray-200 pt-5">
          <label className="block text-sm font-medium text-gray-700 mb-2">Photo (optional)</label>
          <div className="flex items-center gap-3">
            <input
              type="file"
              accept="image/*,.heic,.heif,.webp"
              onChange={(e) => setImage(e.target.files?.[0] || null)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <Upload className="w-5 h-5 text-gray-500" />
          </div>
          <p className="text-xs text-gray-500 mt-1">Allowed: JPG/JPEG/PNG/WEBP/HEIC. Max size: 15MB.</p>
        </div>

        <div className="pt-2">
          <button
            disabled={loading}
            className="w-full md:w-auto px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Submitting...' : 'Submit Complaint'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default NewComplaint;

