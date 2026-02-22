import React, { useState, useEffect } from 'react';
import orderService from '../services/orderService';

export default function AddEditOrderModal({ isOpen, onClose, onSuccess, order = null }) {
  const [formData, setFormData] = useState({
    orderId: '',
    assetName: '',
    quantity: 1,
    supplier: '',
    orderDate: '',
    estimatedDelivery: '',
    currentLocation: '',
    status: 'Ordered',
    notes: ''
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (order) {
      setFormData({
        orderId: order.orderId || '',
        assetName: order.assetName || '',
        quantity: order.quantity || 1,
        supplier: order.supplier || '',
        orderDate: order.orderDate ? order.orderDate.split('T')[0] : '',
        estimatedDelivery: order.estimatedDelivery ? order.estimatedDelivery.split('T')[0] : '',
        currentLocation: order.currentLocation || '',
        status: order.status || 'Ordered',
        notes: order.notes || ''
      });
    } else {
      const today = new Date().toISOString().split('T')[0];
      setFormData({
        orderId: '',
        assetName: '',
        quantity: 1,
        supplier: '',
        orderDate: today,
        estimatedDelivery: '',
        currentLocation: '',
        status: 'Ordered',
        notes: ''
      });
    }
    setErrors({});
  }, [order, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      // Validate required fields before sending
      const requiredErrors = {};
      if (!formData.assetName?.trim()) requiredErrors.assetName = 'Asset name is required';
      if (!formData.quantity || formData.quantity < 1) requiredErrors.quantity = 'Quantity must be at least 1';
      if (!formData.supplier?.trim()) requiredErrors.supplier = 'Supplier is required';
      if (!formData.estimatedDelivery) requiredErrors.estimatedDelivery = 'Estimated delivery date is required';
      if (!formData.currentLocation?.trim()) requiredErrors.currentLocation = 'Current location is required';

      if (Object.keys(requiredErrors).length > 0) {
        setErrors(requiredErrors);
        setLoading(false);
        return;
      }

      // Prepare data for submission
      const submitData = {
        orderId: formData.orderId || undefined,
        assetName: formData.assetName.trim(),
        quantity: parseInt(formData.quantity, 10),
        supplier: formData.supplier.trim(),
        orderDate: formData.orderDate || new Date().toISOString(),
        estimatedDelivery: formData.estimatedDelivery,
        currentLocation: formData.currentLocation.trim(),
        status: formData.status,
        notes: formData.notes?.trim() || ''
      };

      if (order) {
        // Update existing order
        await orderService.updateOrder(order._id, submitData);
      } else {
        // Create new order
        await orderService.createOrder(submitData);
      }
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error creating/updating order:', {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message,
        fullError: err
      });

      const errData = err.response?.data;
      const status = err.response?.status;
      
      if (!err.response) {
        // Network error
        setErrors({ submit: 'Network error - please check your connection' });
      } else if (status === 401) {
        setErrors({ submit: 'You must be logged in to perform this action. Please log in and try again.' });
      } else if (status === 403) {
        setErrors({ submit: 'You do not have permission to create orders. Admin access required.' });
      } else if (status === 400 && errData?.errors) {
        setErrors(errData.errors);
      } else if (status === 400) {
        setErrors({ submit: errData?.message || 'Please check all required fields are filled correctly' });
      } else {
        setErrors({ submit: errData?.message || `Failed to save order (Error ${status})` });
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 border-b border-gray-200 bg-white px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            {order ? 'Edit Order' : 'Create New Order'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {errors.submit && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              {errors.submit}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            {/* Order ID */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Order ID {!order && <span className="text-gray-500">(Auto-generate if empty)</span>}
              </label>
              <input
                type="text"
                name="orderId"
                value={formData.orderId}
                onChange={handleChange}
                placeholder="e.g., ORD-001"
                disabled={!!order}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              />
              {errors.orderId && <p className="text-red-500 text-xs mt-1">{errors.orderId}</p>}
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quantity *
              </label>
              <input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.quantity && <p className="text-red-500 text-xs mt-1">{errors.quantity}</p>}
            </div>

            {/* Asset Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Asset Name *
              </label>
              <input
                type="text"
                name="assetName"
                value={formData.assetName}
                onChange={handleChange}
                placeholder="e.g., MacBook Pro 16 inch"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.assetName && <p className="text-red-500 text-xs mt-1">{errors.assetName}</p>}
            </div>

            {/* Supplier */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Supplier *
              </label>
              <input
                type="text"
                name="supplier"
                value={formData.supplier}
                onChange={handleChange}
                placeholder="e.g., Apple Inc."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.supplier && <p className="text-red-500 text-xs mt-1">{errors.supplier}</p>}
            </div>

            {/* Order Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Order Date
              </label>
              <input
                type="date"
                name="orderDate"
                value={formData.orderDate}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Estimated Delivery */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estimated Delivery *
              </label>
              <input
                type="date"
                name="estimatedDelivery"
                value={formData.estimatedDelivery}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.estimatedDelivery && <p className="text-red-500 text-xs mt-1">{errors.estimatedDelivery}</p>}
            </div>

            {/* Current Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Current Location *
              </label>
              <input
                type="text"
                name="currentLocation"
                value={formData.currentLocation}
                onChange={handleChange}
                placeholder="e.g., Warehouse A"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.currentLocation && <p className="text-red-500 text-xs mt-1">{errors.currentLocation}</p>}
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Ordered">Ordered</option>
                <option value="Processing">Processing</option>
                <option value="Shipped">Shipped</option>
                <option value="InTransit">In Transit</option>
                <option value="OutForDelivery">Out for Delivery</option>
                <option value="Delivered">Delivered</option>
              </select>
              {errors.status && <p className="text-red-500 text-xs mt-1">{errors.status}</p>}
            </div>
          </div>

          {/* Notes */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Additional notes..."
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Footer */}
          <div className="mt-6 flex gap-3 justify-end border-t border-gray-200 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium disabled:opacity-50"
            >
              {loading ? 'Saving...' : order ? 'Update Order' : 'Create Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
