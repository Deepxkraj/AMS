import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../utils/api';

const categories = ['Streetlights', 'Roads', 'Buildings', 'Water Pipelines', 'Public Utilities'];

const AssetModal = ({ asset, departments, onClose, onSuccess }) => {
  const isEdit = Boolean(asset?._id);
  const [loading, setLoading] = useState(false);
  const [technicians, setTechnicians] = useState([]);

  const [form, setForm] = useState({
    name: asset?.name || '',
    assetId: asset?.assetId || '',
    category: asset?.category || 'Streetlights',
    subcategory: asset?.subcategory || '',
    department: asset?.department?._id || asset?.department || (departments?.[0]?._id || ''),
    status: asset?.status || 'Safe',
    priority: asset?.priority || 'Medium',
    condition: asset?.condition?.overall || 'Good',
    address: asset?.location?.address || '',
    latitude: asset?.location?.coordinates?.[1] ?? '',
    longitude: asset?.location?.coordinates?.[0] ?? '',
    description: asset?.description || '',
    manufacturer: asset?.specifications?.manufacturer || '',
    model: asset?.specifications?.model || '',
    yearInstalled: asset?.specifications?.yearInstalled ?? '',
    expectedLifespan: asset?.specifications?.expectedLifespan ?? '',
    material: asset?.specifications?.material || '',
    capacity: asset?.specifications?.capacity || '',
    purchaseCost: asset?.financial?.purchaseCost ?? '',
    currentValue: asset?.financial?.currentValue ?? '',
    replacementCost: asset?.financial?.replacementCost ?? '',
    annualOperatingCost: asset?.financial?.annualOperatingCost ?? '',
    maintenanceFrequency: asset?.maintenance?.frequency || 'Monthly',
    lastMaintenanceDate: asset?.maintenance?.lastMaintenanceDate
      ? asset.maintenance.lastMaintenanceDate.slice(0, 10)
      : '',
    nextMaintenanceDate: asset?.maintenance?.nextMaintenanceDate
      ? asset.maintenance.nextMaintenanceDate.slice(0, 10)
      : '',
    totalMaintenanceCost: asset?.maintenance?.totalMaintenanceCost ?? '',
    assignedTechnician: asset?.assignedTechnician?._id || asset?.assignedTechnician || '',
    lastInspectionDate: asset?.lastInspectionDate ? asset.lastInspectionDate.slice(0, 10) : '',
    nextInspectionDate: asset?.nextInspectionDate ? asset.nextInspectionDate.slice(0, 10) : '',
    notes: asset?.notes || '',
  });

  const canAssign = true;

  const deptId = form.department;

  useEffect(() => {
    // If admin, we don't have "all technicians by department" endpoint; as a fallback,
    // we'll only support assignment from HOD screens. In admin modal, keep assignment optional.
    setTechnicians([]);
  }, [deptId]);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const toNumberOrUndefined = (value) => {
        if (value === '' || value === null || value === undefined) return undefined;
        const num = Number(value);
        return Number.isFinite(num) ? num : undefined;
      };

      const payload = {
        name: form.name,
        assetId: form.assetId,
        category: form.category,
        subcategory: form.subcategory,
        department: form.department,
        status: form.status,
        priority: form.priority,
        condition: {
          overall: form.condition,
        },
        description: form.description,
        assignedTechnician: form.assignedTechnician || undefined,
        location: {
          address: form.address,
          latitude: Number(form.latitude),
          longitude: Number(form.longitude),
        },
        specifications: {
          manufacturer: form.manufacturer || undefined,
          model: form.model || undefined,
          yearInstalled: toNumberOrUndefined(form.yearInstalled),
          expectedLifespan: toNumberOrUndefined(form.expectedLifespan),
          material: form.material || undefined,
          capacity: form.capacity || undefined,
        },
        financial: {
          purchaseCost: toNumberOrUndefined(form.purchaseCost),
          currentValue: toNumberOrUndefined(form.currentValue),
          replacementCost: toNumberOrUndefined(form.replacementCost),
          annualOperatingCost: toNumberOrUndefined(form.annualOperatingCost),
        },
        maintenance: {
          frequency: form.maintenanceFrequency,
          lastMaintenanceDate: form.lastMaintenanceDate || undefined,
          nextMaintenanceDate: form.nextMaintenanceDate || undefined,
          totalMaintenanceCost: toNumberOrUndefined(form.totalMaintenanceCost),
        },
        lastInspectionDate: form.lastInspectionDate || undefined,
        nextInspectionDate: form.nextInspectionDate || undefined,
        notes: form.notes || undefined,
      };

      if (!Number.isFinite(payload.location.latitude) || !Number.isFinite(payload.location.longitude)) {
        toast.error('Please provide a valid latitude and longitude');
        setLoading(false);
        return;
      }

      if (isEdit) {
        await api.put(`/api/assets/${asset._id}`, payload);
        toast.success('Asset updated');
      } else {
        await api.post('/api/assets', payload);
        toast.success('Asset created');
      }
      onSuccess?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save asset');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-lg shadow-xl max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
          <h3 className="text-lg font-semibold text-gray-900">{isEdit ? 'Edit Asset' : 'Add Asset'}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>

        <form onSubmit={submit} className="p-6 space-y-4 overflow-y-auto flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Asset name</label>
              <input
                required
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Streetlight #A-102"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Asset ID</label>
              <input
                required
                value={form.assetId}
                onChange={(e) => setForm((f) => ({ ...f, assetId: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., BD-009-IF-001"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subcategory</label>
              <input
                required
                value={form.subcategory}
                onChange={(e) => setForm((f) => ({ ...f, subcategory: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Industrial Building"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
              <select
                required
                value={form.department}
                onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select department</option>
                {departments?.map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {['Safe', 'Under Maintenance', 'Damaged', 'Recently Repaired', 'Critical'].map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select
                value={form.priority}
                onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {['Low', 'Medium', 'High', 'Critical'].map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Condition</label>
              <select
                value={form.condition}
                onChange={(e) => setForm((f) => ({ ...f, condition: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {['Excellent', 'Good', 'Fair', 'Poor', 'Critical'].map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <input
                required
                value={form.address}
                onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Industrial Estate, Chennai"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
              <input
                required
                value={form.latitude}
                onChange={(e) => setForm((f) => ({ ...f, latitude: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., 28.6139"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
              <input
                required
                value={form.longitude}
                onChange={(e) => setForm((f) => ({ ...f, longitude: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., 77.2090"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Optional notes"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Specifications</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Manufacturer</label>
                  <input
                    value={form.manufacturer}
                    onChange={(e) => setForm((f) => ({ ...f, manufacturer: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
                  <input
                    value={form.model}
                    onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Year Installed</label>
                  <input
                    type="number"
                    value={form.yearInstalled}
                    onChange={(e) => setForm((f) => ({ ...f, yearInstalled: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Expected Lifespan (years)</label>
                  <input
                    type="number"
                    value={form.expectedLifespan}
                    onChange={(e) => setForm((f) => ({ ...f, expectedLifespan: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Material</label>
                  <input
                    value={form.material}
                    onChange={(e) => setForm((f) => ({ ...f, material: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
                  <input
                    value={form.capacity}
                    onChange={(e) => setForm((f) => ({ ...f, capacity: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., 10000 sqm Factory Space"
                  />
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Financial & Maintenance</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Cost (₹)</label>
                  <input
                    type="number"
                    value={form.purchaseCost}
                    onChange={(e) => setForm((f) => ({ ...f, purchaseCost: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Current Value (₹)</label>
                  <input
                    type="number"
                    value={form.currentValue}
                    onChange={(e) => setForm((f) => ({ ...f, currentValue: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Replacement Cost (₹)</label>
                  <input
                    type="number"
                    value={form.replacementCost}
                    onChange={(e) => setForm((f) => ({ ...f, replacementCost: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Annual Operating Cost (₹)</label>
                  <input
                    type="number"
                    value={form.annualOperatingCost}
                    onChange={(e) => setForm((f) => ({ ...f, annualOperatingCost: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Maintenance Frequency</label>
                  <select
                    value={form.maintenanceFrequency}
                    onChange={(e) => setForm((f) => ({ ...f, maintenanceFrequency: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {['Daily', 'Weekly', 'Monthly', 'Quarterly', 'Annually', 'As Needed'].map((fOpt) => (
                      <option key={fOpt} value={fOpt}>
                        {fOpt}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Maintenance Date</label>
                  <input
                    type="date"
                    value={form.lastMaintenanceDate}
                    onChange={(e) => setForm((f) => ({ ...f, lastMaintenanceDate: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Next Maintenance Date</label>
                  <input
                    type="date"
                    value={form.nextMaintenanceDate}
                    onChange={(e) => setForm((f) => ({ ...f, nextMaintenanceDate: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total Maintenance Cost (₹)</label>
                  <input
                    type="number"
                    value={form.totalMaintenanceCost}
                    onChange={(e) => setForm((f) => ({ ...f, totalMaintenanceCost: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Inspection</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Inspection</label>
                  <input
                    type="date"
                    value={form.lastInspectionDate}
                    onChange={(e) => setForm((f) => ({ ...f, lastInspectionDate: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Next Inspection</label>
                  <input
                    type="date"
                    value={form.nextInspectionDate}
                    onChange={(e) => setForm((f) => ({ ...f, nextInspectionDate: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Notes</h4>
              <textarea
                rows={5}
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Any special conditions, risks, or remarks about this asset"
              />
            </div>
          </div>

          {canAssign && (
            <div className="opacity-70">
              <label className="block text-sm font-medium text-gray-700 mb-1">Assign technician (optional)</label>
              <select
                value={form.assignedTechnician}
                onChange={(e) => setForm((f) => ({ ...f, assignedTechnician: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Not assigned</option>
                {technicians.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Assignment is fully supported from the HOD screens (department technicians list). Admin assignment can be added next.
              </p>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              disabled={loading}
              type="submit"
              className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Saving…' : isEdit ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AssetModal;


