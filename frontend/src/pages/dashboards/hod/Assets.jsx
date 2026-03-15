import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../../utils/api';
import StatusBadge from '../../../components/ui/StatusBadge';
import Card from '../../../components/ui/Card';
import AssetModal from '../../../components/AssetModal';

const Assets = () => {
  const [assets, setAssets] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [a, d] = await Promise.all([
        api.get('/api/assets'),
        api.get('/api/departments'),
      ]);
      setAssets(a.data);
      setDepartments(d.data);
    } catch (e) {
      toast.error('Failed to load assets');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card
        title="Department Assets"
        subtitle="Manage assets"
        right={
          <button
            onClick={() => {
              setEditing(null);
              setShowModal(true);
            }}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
          >
            Add Asset
          </button>
        }
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {assets.map((a) => (
                  <tr key={a._id}>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{a.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{a.category}</td>
                    <td className="px-6 py-4 text-sm">
                      <StatusBadge status={a.status} />
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <button
                        onClick={() => {
                          setEditing(a);
                          setShowModal(true);
                        }}
                        className="text-blue-600 hover:underline"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {showModal && (
        <AssetModal
          asset={editing}
          departments={departments}
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false);
            fetchAll();
          }}
        />
      )}
    </div>
  );
};

export default Assets;


