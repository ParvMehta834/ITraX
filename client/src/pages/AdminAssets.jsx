import { useState, useEffect, useCallback } from 'react';
import assetService from '../services/assetService';
import AddEditAssetModal from '../components/AddEditAssetModal';
import FilterDrawer from '../components/FilterDrawer';
import StatusBadge from '../components/StatusBadge';

const STATUSES = ['Available', 'Assigned', 'Maintenance'];

export default function AdminAssets() {
  // Page state
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

  // UI state
  const [showModal, setShowModal] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [toast, setToast] = useState(null);
  const [actionMenu, setActionMenu] = useState(null);

  // Filter state
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ status: 'all', category: '', location: '' });
  const [searchDebounce, setSearchDebounce] = useState(null);

  // Fetch assets
  const fetchAssets = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        const params = {
          page,
          limit: pagination.limit,
          search: search || undefined,
          status: filters.status !== 'all' ? filters.status : undefined,
          category: filters.category || undefined,
          location: filters.location || undefined
        };

        // Remove undefined values
        Object.keys(params).forEach(key => params[key] === undefined && delete params[key]);

        const response = await assetService.getAssets(params);
        setAssets(response.data.data || []);
        setPagination({
          page: response.data.page,
          limit: response.data.limit,
          total: response.data.total,
          totalPages: response.data.totalPages
        });
      } catch (err) {
        showToast('Failed to fetch assets', 'error');
        console.error(err);
      } finally {
        setLoading(false);
      }
    },
    [search, filters, pagination.limit]
  );

  // Debounced search
  useEffect(() => {
    if (searchDebounce) {
      clearTimeout(searchDebounce);
    }
    const timer = setTimeout(() => {
      fetchAssets(1);
    }, 500);
    setSearchDebounce(timer);
    return () => clearTimeout(timer);
  }, [search]);

  // Initial fetch
  useEffect(() => {
    fetchAssets(1);
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Modal handlers
  const openAddModal = () => {
    setSelectedAsset(null);
    setShowModal(true);
    setActionMenu(null);
  };

  const openEditModal = (asset) => {
    setSelectedAsset(asset);
    setShowModal(true);
    setActionMenu(null);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedAsset(null);
  };

  const handleAssetSaved = () => {
    showToast(selectedAsset ? 'Asset updated successfully' : 'Asset created successfully');
    fetchAssets(pagination.page);
  };

  // Delete handler
  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await assetService.deleteAsset(deleteConfirm._id);
      showToast('Asset deleted successfully');
      setDeleteConfirm(null);
      fetchAssets(pagination.page);
    } catch (err) {
      showToast('Failed to delete asset', 'error');
    }
  };

  // Filter handler
  const applyFilters = (newFilters) => {
    setFilters(newFilters);
  };

  // Export handler
  const handleExport = async () => {
    try {
      const params = {
        search: search || undefined,
        status: filters.status !== 'all' ? filters.status : undefined,
        category: filters.category || undefined,
        location: filters.location || undefined
      };
      Object.keys(params).forEach(key => params[key] === undefined && delete params[key]);

      const response = await assetService.exportAssets(params);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `assets-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentChild.removeChild(link);
      showToast('Assets exported successfully');
    } catch (err) {
      showToast('Failed to export assets', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Assets</h1>
          <p className="text-gray-600 mt-1">Track, manage, and optimize all your hardware and licenses in one smart dashboard with real-time alerts.</p>
        </div>

        {/* Controls Row */}
        <div className="flex items-center justify-between mb-6 gap-4">
          {/* Search */}
          <div className="flex-1 relative max-w-sm">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search assets…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => setShowFilter(!showFilter)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 font-medium flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Filter
            </button>
            <button
              onClick={handleExport}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 font-medium flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export
            </button>
            <button
              onClick={openAddModal}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Asset
            </button>
          </div>
        </div>

        {/* Table Card */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input type="checkbox" className="rounded" />
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Asset ID</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Category</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Current Employee</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Current Location</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Manufacturer</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Model</th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="9" className="px-6 py-8 text-center text-gray-500">
                      Loading assets...
                    </td>
                  </tr>
                ) : assets.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="px-6 py-8 text-center text-gray-500">
                      No assets found
                    </td>
                  </tr>
                ) : (
                  assets.map((asset) => (
                    <tr key={asset._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <input type="checkbox" className="rounded" />
                      </td>
                      <td className="px-6 py-4">
                        <a href="#" className="text-blue-600 hover:underline font-medium">
                          {asset.assetId}
                        </a>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={asset.status} />
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{asset.category}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {asset.currentEmployee || '—'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {asset.currentLocation}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">{asset.manufacturer}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{asset.model}</td>
                      <td className="px-6 py-4 text-center">
                        <div className="relative inline-block">
                          <button
                            onClick={() => setActionMenu(actionMenu === asset._id ? null : asset._id)}
                            className="p-2 hover:bg-gray-100 rounded-md text-gray-600"
                          >
                            ⋮
                          </button>
                          {actionMenu === asset._id && (
                            <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-lg border border-gray-200 z-30">
                              <button
                                onClick={() => { openEditModal(asset); }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 first:rounded-t-lg"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => { setDeleteConfirm(asset); setActionMenu(null); }}
                                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 last:rounded-b-lg"
                              >
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!loading && assets.length > 0 && (
            <div className="border-t border-gray-200 px-6 py-4 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                {pagination.total} assets
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => fetchAssets(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  Previous
                </button>
                <span className="px-3 py-1 text-sm text-gray-600">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <button
                  onClick={() => fetchAssets(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages}
                  className="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Delete Confirmation Dialog */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Asset?</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete <strong>{deleteConfirm.assetId}</strong>? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 font-medium"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal & Filter */}
      <AddEditAssetModal
        isOpen={showModal}
        onClose={closeModal}
        onSuccess={handleAssetSaved}
        asset={selectedAsset}
      />

      <FilterDrawer
        isOpen={showFilter}
        onClose={() => setShowFilter(false)}
        onApply={applyFilters}
      />

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-4 right-4 px-6 py-3 rounded-lg text-white ${
          toast.type === 'error' ? 'bg-red-600' : 'bg-green-600'
        }`}>
          {toast.message}
        </div>
      )}
    </div>
  );
}
