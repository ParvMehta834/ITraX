import { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Download, Filter, MoreVertical, Edit, Trash2 } from 'lucide-react';
import licensesService from '../services/licensesService';
import AddEditLicenseModal from '../components/AddEditLicenseModal';

const STATUS_COLORS = {
  'Active': 'bg-blue-100 text-blue-800',
  'Expiring Soon': 'bg-amber-100 text-amber-800',
  'Expired': 'bg-red-100 text-red-800'
};

const ROW_HIGHLIGHT = {
  'Expiring Soon': 'bg-amber-50',
  'Expired': 'bg-red-50'
};

export default function AdminLicenses() {
  // Page state
  const [licenses, setLicenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

  // UI state
  const [showModal, setShowModal] = useState(false);
  const [selectedLicense, setSelectedLicense] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [toast, setToast] = useState(null);
  const [actionMenu, setActionMenu] = useState(null);

  // Filter state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchDebounce, setSearchDebounce] = useState(null);

  // Fetch licenses
  const fetchLicenses = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        const params = {
          page,
          limit: pagination.limit,
          search: search || undefined,
          status: statusFilter !== 'all' ? statusFilter : undefined
        };

        // Remove undefined values
        Object.keys(params).forEach(key => params[key] === undefined && delete params[key]);

        const result = await licensesService.getLicenses(params);
        const paging = result.pagination || {};
        setLicenses(result.data || []);
        setPagination({
          page: paging.page ?? 1,
          limit: paging.limit ?? pagination.limit,
          total: paging.total ?? 0,
          totalPages: paging.pages ?? 1
        });
      } catch (error) {
        showToast(error.response?.data?.message || 'Failed to load licenses', 'error');
      } finally {
        setLoading(false);
      }
    },
    [statusFilter, search, pagination.limit]
  );

  // Search debounce
  useEffect(() => {
    clearTimeout(searchDebounce);
    const timer = setTimeout(() => {
      fetchLicenses(1);
    }, 300);
    setSearchDebounce(timer);
    return () => clearTimeout(timer);
  }, [search]);

  // Initial fetch
  useEffect(() => {
    fetchLicenses(1);
  }, [statusFilter]);

  // Handle edit
  const handleEdit = (license) => {
    setSelectedLicense(license);
    setShowModal(true);
    setActionMenu(null);
  };

  // Handle delete
  const handleDeleteClick = (license) => {
    setDeleteConfirm(license);
    setActionMenu(null);
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirm) return;

    try {
      await licensesService.deleteLicense(deleteConfirm._id);
      showToast('License deleted successfully', 'success');
      setDeleteConfirm(null);
      fetchLicenses(pagination.page);
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to delete license', 'error');
    }
  };

  // Handle export
  const handleExport = async () => {
    try {
      const params = {
        search: search || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined
      };
      Object.keys(params).forEach(key => params[key] === undefined && delete params[key]);

      const response = await licensesService.exportLicenses(params);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'licenses.csv');
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      showToast('Licenses exported successfully', 'success');
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to export licenses', 'error');
    }
  };

  // Toast handler
  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Modal close handler
  const handleModalClose = () => {
    setShowModal(false);
    setSelectedLicense(null);
  };

  const handleModalSuccess = () => {
    handleModalClose();
    fetchLicenses(1);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Software Licenses</h1>
        <p className="text-gray-600 mt-2">
          Manage software licenses, track renewals, and optimize seat allocation across your organization.
        </p>
      </div>

      {/* Controls Row */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between bg-white p-4 rounded-lg border border-gray-200">
        {/* Left: Search */}
        <div className="flex-1 max-w-md relative">
          <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search licenses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>

        {/* Middle: Filter & Export */}
        <div className="flex items-center gap-2">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="Active">Active</option>
            <option value="Expiring Soon">Expiring Soon</option>
            <option value="Expired">Expired</option>
          </select>

          {/* Export Button */}
          <button
            onClick={handleExport}
            disabled={licenses.length === 0}
            className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium text-gray-700"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>

        {/* Right: Add Button */}
        <button
          onClick={() => {
            setSelectedLicense(null);
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium text-sm"
        >
          <Plus className="w-4 h-4" />
          Add License
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-gray-500">Loading...</div>
          </div>
        ) : licenses.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64">
            <p className="text-gray-500 text-lg">No licenses found</p>
            <p className="text-gray-400 text-sm">Add your first license to get started</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">License Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">No. of Seats</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Renewal Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">License Cost</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Status</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {licenses.map((license) => (
                <tr
                  key={license._id}
                  className={`border-b border-gray-200 hover:bg-gray-50 transition-colors ${ROW_HIGHLIGHT[license.status] || ''}`}
                >
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{license.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{license.seats}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(license.renewalDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">${license.cost.toFixed(2)}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[license.status]}`}>
                      {license.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="relative group">
                      <button
                        onClick={() => setActionMenu(actionMenu === license._id ? null : license._id)}
                        className="text-gray-400 hover:text-gray-600 p-1"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {/* Action Menu */}
                      {actionMenu === license._id && (
                        <div className="absolute right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                          <button
                            onClick={() => handleEdit(license)}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                          >
                            <Edit className="w-4 h-4" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteClick(license)}
                            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between bg-white p-4 rounded-lg border border-gray-200">
          <span className="text-sm text-gray-600">
            Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => fetchLicenses(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="px-3 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 text-sm"
            >
              Previous
            </button>
            <button
              onClick={() => fetchLicenses(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
              className="px-3 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 text-sm"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      <AddEditLicenseModal
        isOpen={showModal}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
        license={selectedLicense}
      />

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete License?</h3>
            <p className="text-gray-600 text-sm mb-6">
              Are you sure you want to delete "{deleteConfirm.name}"? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 font-medium"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-4 right-4 px-4 py-3 rounded-md text-white text-sm z-40 ${toast.type === 'success' ? 'bg-green-600' : toast.type === 'error' ? 'bg-red-600' : 'bg-blue-600'}`}>
          {toast.message}
        </div>
      )}
    </div>
  );
}
