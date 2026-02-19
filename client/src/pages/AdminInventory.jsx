import { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Download, Filter, MoreVertical, Edit, Trash2 } from 'lucide-react';
import inventoryService from '../services/inventoryService';
import AddEditInventoryModal from '../components/AddEditInventoryModal';

export default function AdminInventory() {
  // Page state
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

  // UI state
  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [toast, setToast] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);
  const [showActionMenu, setShowActionMenu] = useState(null);

  // Filter state
  const [search, setSearch] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [searchDebounce, setSearchDebounce] = useState(null);

  // Get unique locations for filter
  const [locations, setLocations] = useState([]);

  // Fetch items
  const fetchItems = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        const params = {
          page,
          limit: pagination.limit,
          search: search || undefined,
          location: locationFilter || undefined
        };

        // Remove undefined values
        Object.keys(params).forEach(key => params[key] === undefined && delete params[key]);

        const response = await inventoryService.getItems(params);
        setItems(response.data.data || []);
        setPagination({
          page: response.data.page,
          limit: response.data.limit,
          total: response.data.total,
          totalPages: response.data.totalPages
        });

        // Extract unique locations
        const uniqueLocations = [...new Set(response.data.data.map(item => item.location))];
        setLocations(uniqueLocations);
      } catch (err) {
        showToast('Failed to fetch inventory items', 'error');
        console.error(err);
      } finally {
        setLoading(false);
      }
    },
    [search, locationFilter, pagination.limit]
  );

  // Debounced search
  useEffect(() => {
    if (searchDebounce) {
      clearTimeout(searchDebounce);
    }
    const timer = setTimeout(() => {
      fetchItems(1);
    }, 500);
    setSearchDebounce(timer);
    return () => clearTimeout(timer);
  }, [search]);

  // Initial fetch and location filter change
  useEffect(() => {
    fetchItems(1);
  }, [locationFilter]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Modal handlers
  const openAddModal = () => {
    setSelectedItem(null);
    setShowModal(true);
  };

  const openEditModal = (item) => {
    setSelectedItem(item);
    setShowModal(true);
    setShowActionMenu(null);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedItem(null);
  };

  const handleItemSaved = () => {
    showToast(selectedItem ? 'Item updated successfully' : 'Item added successfully');
    fetchItems(pagination.page);
  };

  // Delete handler
  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await inventoryService.deleteItem(deleteConfirm._id);
      showToast('Item deleted successfully');
      setDeleteConfirm(null);
      fetchItems(pagination.page);
    } catch (err) {
      showToast('Failed to delete item', 'error');
    }
  };

  // Export handler
  const handleExport = async () => {
    try {
      const params = {
        search: search || undefined,
        location: locationFilter || undefined
      };
      Object.keys(params).forEach(key => params[key] === undefined && delete params[key]);

      const response = await inventoryService.exportItems(params);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `inventory-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      showToast('Inventory exported successfully');
    } catch (err) {
      showToast('Failed to export inventory', 'error');
    }
  };

  // Select all handler
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedItems(items.map(item => item._id));
    } else {
      setSelectedItems([]);
    }
  };

  // Select individual item
  const handleSelectItem = (itemId) => {
    if (selectedItems.includes(itemId)) {
      setSelectedItems(selectedItems.filter(id => id !== itemId));
    } else {
      setSelectedItems([...selectedItems, itemId]);
    }
  };

  // Check if item is low stock
  const isLowStock = (item) => {
    return item.quantityOnHand < item.quantityMinimum;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Inventory</h1>
          <p className="text-gray-600 mt-1">
            Manage your inventory stock levels, track quantities, and monitor costs across all locations.
          </p>
        </div>

        {/* Controls Row */}
        <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
          {/* Search */}
          <div className="flex-1 relative max-w-sm">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              <Search className="w-5 h-5" />
            </div>
            <input
              type="text"
              placeholder="Search by name or location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            {/* Location Filter */}
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700 bg-white"
            >
              <option value="">All Locations</option>
              {locations.map(loc => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>

            <button
              onClick={handleExport}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 font-medium flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
            <button
              onClick={openAddModal}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Item
            </button>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center text-gray-500">
            Loading inventory...
          </div>
        ) : items.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="text-gray-500 mb-2">No inventory items found</div>
            <button
              onClick={openAddModal}
              className="text-blue-600 hover:text-blue-700 font-medium text-sm"
            >
              Create your first inventory item
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedItems.length === items.length && items.length > 0}
                        onChange={handleSelectAll}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Qty on Hand
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Qty Minimum
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cost per Item
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {items.map((item) => (
                    <tr
                      key={item._id}
                      className={`hover:bg-gray-50 ${isLowStock(item) ? 'bg-red-50' : ''}`}
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedItems.includes(item._id)}
                          onChange={() => handleSelectItem(item._id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-gray-900">{item.name}</div>
                        {isLowStock(item) && (
                          <div className="text-xs text-red-600 mt-1">⚠ Low Stock</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">{item.location}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-right font-medium">
                        {item.quantityOnHand}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 text-right">
                        {item.quantityMinimum}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-right">
                        ${item.costPerItem.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-right font-semibold">
                        ${item.total.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-center relative">
                        <button
                          onClick={() => setShowActionMenu(showActionMenu === item._id ? null : item._id)}
                          className="text-gray-400 hover:text-gray-600 p-1"
                        >
                          <MoreVertical className="w-5 h-5" />
                        </button>
                        
                        {/* Action Menu */}
                        {showActionMenu === item._id && (
                          <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                            <button
                              onClick={() => openEditModal(item)}
                              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                            >
                              <Edit className="w-4 h-4" />
                              Edit
                            </button>
                            <button
                              onClick={() => {
                                setDeleteConfirm(item);
                                setShowActionMenu(null);
                              }}
                              className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="border-t border-gray-200 px-4 py-3 flex items-center justify-between bg-gray-50">
              <div className="text-sm text-gray-600">
                Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                {pagination.total} items
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => fetchItems(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="px-3 py-1 border border-gray-300 rounded-md hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  Previous
                </button>
                <span className="px-3 py-1 text-sm text-gray-600">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <button
                  onClick={() => fetchItems(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages}
                  className="px-3 py-1 border border-gray-300 rounded-md hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Delete Confirmation Dialog */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Item?</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete <strong>{deleteConfirm.name}</strong>? This action cannot be undone.
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

      {/* Modal */}
      <AddEditInventoryModal
        isOpen={showModal}
        onClose={closeModal}
        onSuccess={handleItemSaved}
        item={selectedItem}
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
