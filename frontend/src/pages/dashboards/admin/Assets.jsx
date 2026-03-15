import { useEffect, useState } from 'react';
import api from '../../../utils/api';
import toast from 'react-hot-toast';
import { Plus, Edit, Trash2, Eye, MapPin, Calendar, AlertTriangle, ChevronDown, ChevronRight } from 'lucide-react';
import AssetModal from '../../../components/AssetModal';

const Assets = () => {
  const [assets, setAssets] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [expandedDepartments, setExpandedDepartments] = useState(new Set());

  useEffect(() => {
    fetchAssets();
    fetchDepartments();
  }, []);

  const fetchAssets = async () => {
    try {
      const response = await api.get('/api/assets');
      setAssets(response.data);
    } catch (error) {
      console.error('Error fetching assets:', error);
      toast.error('Failed to fetch assets');
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await api.get('/api/departments');
      setDepartments(response.data);
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const toggleDepartment = (departmentId) => {
    const newExpanded = new Set(expandedDepartments);
    if (newExpanded.has(departmentId)) {
      newExpanded.delete(departmentId);
    } else {
      newExpanded.add(departmentId);
    }
    setExpandedDepartments(newExpanded);
  };

  const groupAssetsByDepartment = () => {
    const grouped = {};
    
    // Initialize all departments
    departments.forEach(dept => {
      grouped[dept._id] = {
        department: dept,
        assets: []
      };
    });

    // Group assets by department
    assets.forEach(asset => {
      const deptId = asset.department?._id;
      if (deptId && grouped[deptId]) {
        grouped[deptId].assets.push(asset);
      }
    });

    return Object.values(grouped);
  };

  const getDepartmentStats = (departmentAssets) => {
    const total = departmentAssets.length;
    const critical = departmentAssets.filter(a => a.priority === 'Critical').length;
    const underMaintenance = departmentAssets.filter(a => a.status === 'Under Maintenance').length;
    const totalValue = departmentAssets.reduce((sum, a) => sum + (a.financial?.currentValue || 0), 0);

    return { total, critical, underMaintenance, totalValue };
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this asset?')) return;

    try {
      await api.delete(`/api/assets/${id}`);
      toast.success('Asset deleted successfully');
      fetchAssets();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete asset');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'Safe': 'bg-green-100 text-green-800',
      'Under Maintenance': 'bg-yellow-100 text-yellow-800',
      'Damaged': 'bg-red-100 text-red-800',
      'Recently Repaired': 'bg-blue-100 text-blue-800',
      'Critical': 'bg-red-200 text-red-900'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      'Low': 'bg-gray-100 text-gray-800',
      'Medium': 'bg-blue-100 text-blue-800',
      'High': 'bg-orange-100 text-orange-800',
      'Critical': 'bg-red-100 text-red-800'
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  const getConditionColor = (condition) => {
    const colors = {
      'Excellent': 'bg-green-100 text-green-800',
      'Good': 'bg-blue-100 text-blue-800',
      'Fair': 'bg-yellow-100 text-yellow-800',
      'Poor': 'bg-orange-100 text-orange-800',
      'Critical': 'bg-red-100 text-red-800'
    };
    return colors[condition] || 'bg-gray-100 text-gray-800';
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const formatDate = (date) => {
    return date ? new Date(date).toLocaleDateString('en-IN') : '-';
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Assets Management</h2>
        <button
          onClick={() => {
            setEditingAsset(null);
            setShowModal(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Add Asset</span>
        </button>
      </div>

      {/* Asset Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Total Assets</h3>
          <p className="text-2xl font-bold text-gray-900">{assets.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Critical Assets</h3>
          <p className="text-2xl font-bold text-red-600">
            {assets.filter(a => a.priority === 'Critical').length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Under Maintenance</h3>
          <p className="text-2xl font-bold text-yellow-600">
            {assets.filter(a => a.status === 'Under Maintenance').length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Total Value</h3>
          <p className="text-2xl font-bold text-green-600">
            {formatCurrency(assets.reduce((sum, a) => sum + (a.financial?.currentValue || 0), 0))}
          </p>
        </div>
      </div>

      {/* Grouped Assets by Department */}
      <div className="space-y-4">
        {groupAssetsByDepartment().map(({ department, assets: departmentAssets }) => {
          const stats = getDepartmentStats(departmentAssets);
          const isExpanded = expandedDepartments.has(department._id);
          
          return (
            <div key={department._id} className="bg-white rounded-lg shadow overflow-hidden">
              {/* Department Header */}
              <div 
                className="px-6 py-4 bg-gray-50 border-b border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => toggleDepartment(department._id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center">
                      {isExpanded ? (
                        <ChevronDown className="w-5 h-5 text-gray-500 mr-2" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-gray-500 mr-2" />
                      )}
                      <h3 className="text-lg font-semibold text-gray-900">{department.name}</h3>
                    </div>
                    <div className="flex items-center space-x-4 text-sm">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                        {stats.total} assets
                      </span>
                      {stats.critical > 0 && (
                        <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full">
                          {stats.critical} critical
                        </span>
                      )}
                      {stats.underMaintenance > 0 && (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full">
                          {stats.underMaintenance} maintenance
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Total Value</p>
                    <p className="text-lg font-bold text-green-600">{formatCurrency(stats.totalValue)}</p>
                  </div>
                </div>
              </div>

              {/* Assets Table (Expanded) */}
              {isExpanded && (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Asset Details
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Category
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Priority
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Value
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Assigned Technician
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Department HOD
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {departmentAssets.map((asset) => (
                        <tr key={asset._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{asset.name}</div>
                              <div className="text-xs text-gray-500">ID: {asset.assetId}</div>
                              <div className="text-xs text-gray-500 flex items-center mt-1">
                                <MapPin className="w-3 h-3 mr-1" />
                                {asset.location?.address || '-'}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div>
                              <div className="text-sm text-gray-900">{asset.category}</div>
                              <div className="text-xs text-gray-500">{asset.subcategory}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(asset.status)}`}>
                              {asset.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(asset.priority)}`}>
                              {asset.priority}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {formatCurrency(asset.financial?.currentValue)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {asset.assignedTechnician?.name || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {asset.departmentHOD?.name || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                            <button
                              onClick={() => {
                                setSelectedAsset(asset);
                                setShowDetails(true);
                              }}
                              className="text-green-600 hover:text-green-900"
                              title="View Details"
                            >
                              <Eye className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => {
                                setEditingAsset(asset);
                                setShowModal(true);
                              }}
                              className="text-blue-600 hover:text-blue-900"
                              title="Edit Asset"
                            >
                              <Edit className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleDelete(asset._id)}
                              className="text-red-600 hover:text-red-900"
                              title="Delete Asset"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Asset Details Modal */}
      {showDetails && selectedAsset && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-2/3 shadow-lg rounded-lg bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">Asset Details</h3>
              <button
                onClick={() => {
                  setShowDetails(false);
                  setSelectedAsset(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900">Basic Information</h4>
                <div className="space-y-2">
                  <div><span className="font-medium">Name:</span> {selectedAsset.name}</div>
                  <div><span className="font-medium">Asset ID:</span> {selectedAsset.assetId}</div>
                  <div><span className="font-medium">Category:</span> {selectedAsset.category}</div>
                  <div><span className="font-medium">Subcategory:</span> {selectedAsset.subcategory}</div>
                  <div><span className="font-medium">Department:</span> {selectedAsset.department?.name}</div>
                  <div><span className="font-medium">Description:</span> {selectedAsset.description}</div>
                </div>
              </div>

              {/* Status and Priority */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900">Status & Priority</h4>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <span className="font-medium mr-2">Status:</span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedAsset.status)}`}>
                      {selectedAsset.status}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <span className="font-medium mr-2">Priority:</span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(selectedAsset.priority)}`}>
                      {selectedAsset.priority}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <span className="font-medium mr-2">Condition:</span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getConditionColor(selectedAsset.condition?.overall)}`}>
                      {selectedAsset.condition?.overall}
                    </span>
                  </div>
                  <div><span className="font-medium">Assigned Technician:</span> {selectedAsset.assignedTechnician?.name || '-'}</div>
                  <div><span className="font-medium">Complaints:</span> {selectedAsset.complaintCount || 0}</div>
                </div>
              </div>

              {/* Location */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900">Location</h4>
                <div className="space-y-2">
                  <div><span className="font-medium">Address:</span> {selectedAsset.location?.address}</div>
                  <div><span className="font-medium">Coordinates:</span> {selectedAsset.location?.coordinates?.join(', ')}</div>
                </div>
              </div>

              {/* Financial Information */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900">Financial Information</h4>
                <div className="space-y-2">
                  <div><span className="font-medium">Purchase Cost:</span> {formatCurrency(selectedAsset.financial?.purchaseCost)}</div>
                  <div><span className="font-medium">Current Value:</span> {formatCurrency(selectedAsset.financial?.currentValue)}</div>
                  <div><span className="font-medium">Replacement Cost:</span> {formatCurrency(selectedAsset.financial?.replacementCost)}</div>
                  <div><span className="font-medium">Annual Operating Cost:</span> {formatCurrency(selectedAsset.financial?.annualOperatingCost)}</div>
                </div>
              </div>

              {/* Specifications */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900">Specifications</h4>
                <div className="space-y-2">
                  <div><span className="font-medium">Manufacturer:</span> {selectedAsset.specifications?.manufacturer || '-'}</div>
                  <div><span className="font-medium">Model:</span> {selectedAsset.specifications?.model || '-'}</div>
                  <div><span className="font-medium">Year Installed:</span> {selectedAsset.specifications?.yearInstalled || '-'}</div>
                  <div><span className="font-medium">Expected Lifespan:</span> {selectedAsset.specifications?.expectedLifespan ? `${selectedAsset.specifications.expectedLifespan} years` : '-'}</div>
                  <div><span className="font-medium">Material:</span> {selectedAsset.specifications?.material || '-'}</div>
                  <div><span className="font-medium">Capacity:</span> {selectedAsset.specifications?.capacity || '-'}</div>
                </div>
              </div>

              {/* Maintenance */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900">Maintenance</h4>
                <div className="space-y-2">
                  <div><span className="font-medium">Frequency:</span> {selectedAsset.maintenance?.frequency || '-'}</div>
                  <div><span className="font-medium">Last Maintenance:</span> {formatDate(selectedAsset.maintenance?.lastMaintenanceDate)}</div>
                  <div><span className="font-medium">Next Maintenance:</span> {formatDate(selectedAsset.maintenance?.nextMaintenanceDate)}</div>
                  <div><span className="font-medium">Total Maintenance Cost:</span> {formatCurrency(selectedAsset.maintenance?.totalMaintenanceCost)}</div>
                </div>
              </div>

              {/* Inspection Dates */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900">Inspection</h4>
                <div className="space-y-2">
                  <div><span className="font-medium">Last Inspection:</span> {formatDate(selectedAsset.lastInspectionDate)}</div>
                  <div><span className="font-medium">Next Inspection:</span> {formatDate(selectedAsset.nextInspectionDate)}</div>
                </div>
              </div>

              {/* Notes */}
              {selectedAsset.notes && (
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900">Notes</h4>
                  <div className="text-sm text-gray-600">{selectedAsset.notes}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <AssetModal
          asset={editingAsset}
          departments={departments}
          onClose={() => {
            setShowModal(false);
            setEditingAsset(null);
          }}
          onSuccess={() => {
            fetchAssets();
            setShowModal(false);
            setEditingAsset(null);
          }}
        />
      )}
    </div>
  );
};

export default Assets;

