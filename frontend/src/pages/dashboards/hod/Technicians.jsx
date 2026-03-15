import { useEffect, useState } from 'react';
import api from '../../../utils/api';
import Card from '../../../components/ui/Card';
import toast from 'react-hot-toast';
import { Eye, Edit, Trash2, UserPlus, CheckCircle, XCircle } from 'lucide-react';

const Technicians = () => {
  const [technicians, setTechnicians] = useState([]);
  const [pendingTechnicians, setPendingTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTechnician, setEditingTechnician] = useState(null);
  const [viewingTechnician, setViewingTechnician] = useState(null);
  const [activeTab, setActiveTab] = useState('approved');

  useEffect(() => {
    fetchTechnicians();
    fetchPendingTechnicians();
  }, []);

  const fetchTechnicians = async () => {
    try {
      const res = await api.get('/api/users/technicians');
      setTechnicians(res.data);
    } catch (error) {
      console.error('Error fetching technicians:', error);
      toast.error('Failed to fetch technicians');
    }
  };

  const fetchPendingTechnicians = async () => {
    try {
      const res = await api.get('/api/users/pending-approvals');
      setPendingTechnicians(res.data.filter(user => user.role === 'technician'));
    } catch (error) {
      console.error('Error fetching pending technicians:', error);
      toast.error('Failed to fetch pending technicians');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (technicianId) => {
    try {
      await api.put(`/api/users/${technicianId}/approve`);
      toast.success('Technician approved successfully');
      fetchTechnicians();
      fetchPendingTechnicians();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to approve technician');
    }
  };

  const handleDeactivate = async (technicianId) => {
    if (!window.confirm('Are you sure you want to deactivate this technician?')) return;
    
    try {
      await api.put(`/api/users/${technicianId}`, { isActive: false });
      toast.success('Technician deactivated successfully');
      fetchTechnicians();
    } catch (error) {
      toast.error('Failed to deactivate technician');
    }
  };

  const handleActivate = async (technicianId) => {
    try {
      await api.put(`/api/users/${technicianId}`, { isActive: true });
      toast.success('Technician activated successfully');
      fetchTechnicians();
    } catch (error) {
      toast.error('Failed to activate technician');
    }
  };

  const handleView = (technician) => {
    setViewingTechnician(technician);
  };

  const getStatusBadge = (technician) => {
    if (!technician.isActive) {
      return <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">Inactive</span>;
    }
    return <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">Active</span>;
  };

  const TechniciansTable = ({ data, showActions = true }) => (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            {showActions && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((technician) => (
            <tr key={technician._id}>
              <td className="px-6 py-4 text-sm font-medium text-gray-900">{technician.name}</td>
              <td className="px-6 py-4 text-sm text-gray-600">{technician.email}</td>
              <td className="px-6 py-4 text-sm text-gray-600">{technician.phone || '-'}</td>
              <td className="px-6 py-4 whitespace-nowrap">
                {getStatusBadge(technician)}
              </td>
              {showActions && (
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <button
                    onClick={() => handleView(technician)}
                    className="text-blue-600 hover:text-blue-900"
                    title="View Details"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  {technician.isActive ? (
                    <button
                      onClick={() => handleDeactivate(technician._id)}
                      className="text-orange-600 hover:text-orange-900"
                      title="Deactivate"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={() => handleActivate(technician._id)}
                      className="text-green-600 hover:text-green-900"
                      title="Activate"
                    >
                      <CheckCircle className="w-4 h-4" />
                    </button>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="space-y-6">
      <Card title="Technician Management" subtitle="Manage technicians in your department">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('approved')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'approved'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Approved Technicians ({technicians.length})
            </button>
            <button
              onClick={() => setActiveTab('pending')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'pending'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Pending Approval ({pendingTechnicians.length})
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {loading ? (
          <div className="text-gray-600 text-center py-8">Loading…</div>
        ) : activeTab === 'approved' ? (
          <div>
            {technicians.length === 0 ? (
              <div className="text-gray-600 text-center py-8">No approved technicians found.</div>
            ) : (
              <TechniciansTable data={technicians} showActions={true} />
            )}
          </div>
        ) : (
          <div>
            {pendingTechnicians.length === 0 ? (
              <div className="text-gray-600 text-center py-8">No technicians pending approval.</div>
            ) : (
              <TechniciansTable data={pendingTechnicians} showActions={false} />
            )}
          </div>
        )}
      </Card>

      {/* Pending Approval Actions */}
      {activeTab === 'pending' && pendingTechnicians.length > 0 && (
        <Card title="Pending Approvals" subtitle="Technicians waiting for your approval">
          <div className="space-y-4">
            {pendingTechnicians.map((technician) => (
              <div key={technician._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900">{technician.name}</h4>
                  <p className="text-sm text-gray-600">{technician.email}</p>
                  <p className="text-sm text-gray-500">Phone: {technician.phone || 'Not provided'}</p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleApprove(technician._id)}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Approve</span>
                  </button>
                  <button
                    onClick={() => handleView(technician)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
                  >
                    <Eye className="w-4 h-4" />
                    <span>View</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Technician Details Modal */}
      {viewingTechnician && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-lg bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">Technician Details</h3>
              <button
                onClick={() => setViewingTechnician(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900">Personal Information</h4>
                <div className="mt-2 space-y-2">
                  <div><span className="font-medium">Name:</span> {viewingTechnician.name}</div>
                  <div><span className="font-medium">Email:</span> {viewingTechnician.email}</div>
                  <div><span className="font-medium">Phone:</span> {viewingTechnician.phone || 'Not provided'}</div>
                  <div><span className="font-medium">Status:</span> {getStatusBadge(viewingTechnician)}</div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900">Account Information</h4>
                <div className="mt-2 space-y-2">
                  <div><span className="font-medium">Role:</span> Technician</div>
                  <div><span className="font-medium">Department:</span> {viewingTechnician.department?.name || 'Not assigned'}</div>
                  <div><span className="font-medium">Admin Approved:</span> {viewingTechnician.adminApproved ? 'Yes' : 'No'}</div>
                  <div><span className="font-medium">HOD Approved:</span> {viewingTechnician.hodApproved ? 'Yes' : 'No'}</div>
                  <div><span className="font-medium">Member Since:</span> {new Date(viewingTechnician.createdAt).toLocaleDateString()}</div>
                </div>
              </div>

              {!viewingTechnician.hodApproved && (
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      handleApprove(viewingTechnician._id);
                      setViewingTechnician(null);
                    }}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                  >
                    Approve Technician
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Technicians;


