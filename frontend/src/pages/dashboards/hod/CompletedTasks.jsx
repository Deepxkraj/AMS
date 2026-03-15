import { useEffect, useState } from 'react';
import api from '../../../utils/api';
import Card from '../../../components/ui/Card';

const CompletedTasks = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/assets');
      const logs = [];

      res.data.forEach((asset) => {
        (asset.maintenance?.maintenanceHistory || []).forEach((log) => {
          logs.push({
            asset,
            log,
          });
        });
      });

      logs.sort(
        (a, b) => new Date(b.log.date || b.log.createdAt) - new Date(a.log.date || a.log.createdAt),
      );

      setItems(logs);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card
      title="Department Completed Maintenance"
      subtitle="All maintenance tasks performed on department assets"
    >
      {loading ? (
        <div className="text-gray-600">Loading…</div>
      ) : items.length === 0 ? (
        <div className="text-gray-600">No maintenance logs found.</div>
      ) : (
        <div className="space-y-4">
          {items.map(({ asset, log }, idx) => (
            <div
              key={`${asset._id}-${log._id || idx}`}
              className="bg-white border border-gray-200 rounded-lg p-4"
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <div className="text-base font-semibold text-gray-900">
                    {asset.name}{' '}
                    <span className="text-xs text-gray-500">({asset.assetId})</span>
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    Category: {asset.category} • Type: {log.type || 'Maintenance'}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Technician: {log.technician?.name || 'Unknown'}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Date:{' '}
                    {log.date
                      ? new Date(log.date).toLocaleString('en-IN')
                      : 'Not available'}
                  </div>
                  {log.cost !== undefined && (
                    <div className="text-xs text-gray-500">
                      Cost: ₹{Number(log.cost).toLocaleString('en-IN')}
                    </div>
                  )}
                </div>
                <div className="text-sm text-gray-700 md:w-1/2">
                  <div className="font-medium mb-1">Maintenance Details</div>
                  <div className="text-gray-600 whitespace-pre-line">
                    {log.description || 'No description provided.'}
                  </div>
                </div>
              </div>

              {Array.isArray(log.photos) && log.photos.length > 0 && (
                <div className="mt-4">
                  <div className="text-xs font-medium text-gray-700 mb-2">Proof Photos</div>
                  <div className="flex flex-wrap gap-2">
                    {log.photos.map((url, i) => (
                      <a
                        key={i}
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="block border rounded overflow-hidden w-24 h-24 bg-gray-100"
                      >
                        <img
                          src={url}
                          alt="maintenance proof"
                          className="w-full h-full object-cover"
                        />
                      </a>
                    ))}
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

export default CompletedTasks;

