import { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Download, MoreVertical, Edit, Trash2 } from 'lucide-react';
import locationsService from '../services/locationsService';
import AddEditLocationModal from '../components/AddEditLocationModal';

export default function AdminLocations() {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

  const [showModal, setShowModal] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [toast, setToast] = useState(null);
  const [actionMenu, setActionMenu] = useState(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchDebounce, setSearchDebounce] = useState(null);

  const fetchLocations = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        const params = {
          page,
          limit: pagination.limit,
          search: search || undefined,
          status: statusFilter || undefined
        };
        Object.keys(params).forEach(key => params[key] === undefined && delete params[key]);

        const result = await locationsService.getLocations(params);
        const paging = result.pagination || {};
        setLocations(result.data || []);
        setPagination({
          page: paging.page ?? 1,
          limit: paging.limit ?? pagination.limit,
          total: paging.total ?? 0,
          totalPages: paging.pages ?? 1
        });
      } catch (error) {
        showToast('Failed to load locations', 'error');
      } finally {
        setLoading(false);
      }
    },
    [search, statusFilter, pagination.limit]
  );

  useEffect(() => {
    clearTimeout(searchDebounce);
    const timer = setTimeout(() => {
      fetchLocations(1);
    }, 300);
    setSearchDebounce(timer);
    return () => clearTimeout(timer);
  }, [search, statusFilter]);

  useEffect(() => {
    fetchLocations(1);
  }, []);

  const handleEdit = (location) => {
    setSelectedLocation(location);
    setShowModal(true);
    setActionMenu(null);
  };

  const handleDeleteClick = (location) => {
    setDeleteConfirm(location);
    setActionMenu(null);
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await locationsService.deleteLocation(deleteConfirm._id);
      showToast('Location deleted successfully', 'success');
      setDeleteConfirm(null);
      fetchLocations(pagination.page);
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to delete location', 'error');
    }
  };

  const handleExport = async () => {
    try {
      const params = {
        search: search || undefined,
        status: statusFilter || undefined
      };
      Object.keys(params).forEach(key => params[key] === undefined && delete params[key]);

      const response = await locationsService.exportLocations(params);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'locations.csv');
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      showToast('Locations exported successfully', 'success');
    } catch (error) {
      showToast('Failed to export locations', 'error');
    }
  };

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setSelectedLocation(null);
  };

  const handleModalSuccess = () => {
    handleModalClose();
    fetchLocations(1);
  };

  const isOverCapacity = (location) => {
    return location.capacity && location.assignedAssets > location.capacity;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Locations</h1>
        <p className="text-gray-600 mt-2">
          Manage asset locations and monitor capacity utilization.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white p-4 rounded-lg border border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, city, state..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        >
          <option value="">All Status</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={handleExport}
          disabled={locations.length === 0}
          className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium text-gray-700 bg-white"
        >
          <Download className="w-4 h-4" />
          Export
        </button>

        <button
          onClick={() => {
            setSelectedLocation(null);
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium text-sm"
        >
          <Plus className="w-4 h-4" />
          Add Location
        </button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-gray-500">Loading...</div>
          </div>
        ) : locations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64">
            <p className="text-gray-500 text-lg">No locations found</p>
            <p className="text-gray-400 text-sm">Add your first location to get started</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">City</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">State</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Capacity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Assigned Assets</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Status</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {locations.map((location) => {
                const overCapacity = isOverCapacity(location);
                return (
                  <tr
                    key={location._id}
                    className={`border-b border-gray-200 transition-colors ${
                      overCapacity ? 'bg-red-50 hover:bg-red-100' : 'hover:bg-gray-50'
                    }`}
                  >
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{location.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        location.type === 'Office' 
                          ? 'bg-blue-100 text-blue-700' 
                          : 'bg-amber-100 text-amber-700'
                      }`}>
                        {location.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{location.city}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{location.state}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{location.capacity}</td>
                    <td className="px-6 py-4 text-sm font-medium">
                      <span className={overCapacity ? 'text-red-600 font-bold' : 'text-gray-600'}>
                        {location.assignedAssets || 0}
                        {overCapacity && <span className="ml-1 text-red-600">⚠️</span>}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        location.status === 'Active' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {location.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="relative group">
                        <button
                          onClick={() => setActionMenu(actionMenu === location._id ? null : location._id)}
                          className="text-gray-400 hover:text-gray-600 p-1"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {actionMenu === location._id && (
                          <div className="absolute right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                            <button
                              onClick={() => handleEdit(location)}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                            >
                              <Edit className="w-4 h-4" />
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteClick(location)}
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
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between bg-white p-4 rounded-lg border border-gray-200">
          <span className="text-sm text-gray-600">
            Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => fetchLocations(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="px-3 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 text-sm"
            >
              Previous
            </button>
            <button
              onClick={() => fetchLocations(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
              className="px-3 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 text-sm"
            >
              Next
            </button>
          </div>
        </div>
      )}

      <AddEditLocationModal
        isOpen={showModal}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
        location={selectedLocation}
      />

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Location?</h3>
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

      {toast && (
        <div className={`fixed bottom-4 right-4 px-4 py-3 rounded-md text-white text-sm z-40 ${toast.type === 'success' ? 'bg-green-600' : toast.type === 'error' ? 'bg-red-600' : 'bg-blue-600'}`}>
          {toast.message}
        </div>
      )}
    </div>
  );
}
