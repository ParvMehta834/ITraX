import { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Download, Filter } from 'lucide-react';
import orderService from '../services/orderService';
import OrderCard from '../components/OrderCard';
import AddEditOrderModal from '../components/AddEditOrderModal';

const STATUS_OPTIONS = ['Ordered', 'Processing', 'Shipped', 'InTransit', 'OutForDelivery', 'Delivered'];

export default function TrackingPage() {
  // Page state
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

  // UI state
  const [showModal, setShowModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [toast, setToast] = useState(null);

  // Filter state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchDebounce, setSearchDebounce] = useState(null);

  // Fetch orders
  const fetchOrders = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        const params = {
          page,
          limit: pagination.limit,
          search: search || undefined,
          status: statusFilter || undefined
        };

        // Remove undefined values
        Object.keys(params).forEach(key => params[key] === undefined && delete params[key]);

        const result = await orderService.getOrders(params);
        const paging = result.pagination || {};
        setOrders(result.data || []);
        setPagination({
          page: paging.page ?? 1,
          limit: paging.limit ?? pagination.limit,
          total: paging.total ?? 0,
          totalPages: paging.pages ?? 1
        });
      } catch (err) {
        showToast('Failed to fetch orders', 'error');
        console.error(err);
      } finally {
        setLoading(false);
      }
    },
    [search, statusFilter, pagination.limit]
  );

  // Debounced search
  useEffect(() => {
    if (searchDebounce) {
      clearTimeout(searchDebounce);
    }
    const timer = setTimeout(() => {
      fetchOrders(1);
    }, 500);
    setSearchDebounce(timer);
    return () => clearTimeout(timer);
  }, [search]);

  // Initial fetch
  useEffect(() => {
    fetchOrders(1);
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Modal handlers
  const openAddModal = () => {
    setSelectedOrder(null);
    setShowModal(true);
  };

  const openEditModal = (order) => {
    setSelectedOrder(order);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedOrder(null);
  };

  const handleOrderSaved = () => {
    showToast(selectedOrder ? 'Order updated successfully' : 'Order created successfully');
    fetchOrders(pagination.page);
  };

  // Delete handler
  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await orderService.deleteOrder(deleteConfirm._id);
      showToast('Order deleted successfully');
      setDeleteConfirm(null);
      fetchOrders(pagination.page);
    } catch (err) {
      showToast('Failed to delete order', 'error');
    }
  };

  // Status update handler
  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await orderService.updateOrderStatus(orderId, newStatus);
      showToast(`Order marked as ${newStatus}`);
      fetchOrders(pagination.page);
    } catch (err) {
      showToast('Failed to update status', 'error');
    }
  };

  // Export handler
  const handleExport = async () => {
    try {
      const params = {
        search: search || undefined,
        status: statusFilter || undefined
      };
      Object.keys(params).forEach(key => params[key] === undefined && delete params[key]);

      const response = await orderService.exportOrders(params);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `orders-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentChild?.removeChild(link);
      showToast('Orders exported successfully');
    } catch (err) {
      showToast('Failed to export orders', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Order Tracking</h1>
          <p className="text-gray-600 mt-1">Track company and employee asset orders in real-time</p>
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
              placeholder="Search by order ID, asset name, employee..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); fetchOrders(1); }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700 bg-white"
          >
            <option value="">All Status</option>
            {STATUS_OPTIONS.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>

          {/* Action Buttons */}
          <div className="flex gap-3">
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
              Add Order
            </button>
          </div>
        </div>

        {/* Orders List */}
        {loading ? (
          <div className="text-center py-12 text-gray-500">
            Loading orders...
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 mb-2">No orders found</div>
            <button
              onClick={openAddModal}
              className="text-blue-600 hover:text-blue-700 font-medium text-sm"
            >
              Create your first order
            </button>
          </div>
        ) : (
          <div className="space-y-4 mb-8">
            {orders.map((order) => (
              <OrderCard
                key={order._id}
                order={order}
                onEdit={openEditModal}
                onDelete={(ord) => setDeleteConfirm(ord)}
                onStatusChange={handleStatusChange}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && orders.length > 0 && (
          <div className="border-t border-gray-200 pt-4 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
              {pagination.total} orders
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => fetchOrders(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                Previous
              </button>
              <span className="px-3 py-1 text-sm text-gray-600">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                onClick={() => fetchOrders(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                className="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Delete Confirmation Dialog */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Order?</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete <strong>{deleteConfirm.orderId}</strong>? This action cannot be undone.
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
      <AddEditOrderModal
        isOpen={showModal}
        onClose={closeModal}
        onSuccess={handleOrderSaved}
        order={selectedOrder}
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
