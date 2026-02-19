import React from 'react';
import { Package, MapPin, Calendar, Truck, CheckCircle, Clock } from 'lucide-react';

const STATUSES = ['Ordered', 'Processing', 'Shipped', 'InTransit', 'OutForDelivery', 'Delivered'];

const STATUS_COLORS = {
  'Ordered': { bg: 'bg-blue-100', text: 'text-blue-800', icon: 'text-blue-600' },
  'Processing': { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: 'text-yellow-600' },
  'Shipped': { bg: 'bg-purple-100', text: 'text-purple-800', icon: 'text-purple-600' },
  'InTransit': { bg: 'bg-indigo-100', text: 'text-indigo-800', icon: 'text-indigo-600' },
  'OutForDelivery': { bg: 'bg-orange-100', text: 'text-orange-800', icon: 'text-orange-600' },
  'Delivered': { bg: 'bg-green-100', text: 'text-green-800', icon: 'text-green-600' }
};

export default function OrderCard({ order, onEdit, onDelete, onStatusChange }) {
  const statusColors = STATUS_COLORS[order.status] || STATUS_COLORS['Ordered'];
  const currentStatusIndex = STATUSES.indexOf(order.status);

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleStatusClick = (newStatus) => {
    if (order.status !== newStatus && onStatusChange) {
      onStatusChange(order._id, newStatus);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
      {/* Header Section */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <Package className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">{order.assetName}</h3>
            <span className="text-sm font-medium text-gray-500">({order.quantity} units)</span>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span className="font-mono text-blue-600 font-semibold">{order.orderId}</span>
            <span>{formatDate(order.orderDate)}</span>
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex flex-col items-end gap-2">
          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${statusColors.bg} ${statusColors.text}`}>
            {order.status}
          </span>
        </div>
      </div>

      {/* Middle Section - Info */}
      <div className="grid grid-cols-2 gap-4 mb-6 pb-6 border-b border-gray-200">
        {/* Supplier */}
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Supplier</p>
          <p className="text-sm font-medium text-gray-900">{order.supplier}</p>
        </div>

        {/* Estimated Delivery */}
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Est. Delivery</p>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <p className="text-sm font-medium text-gray-900">{formatDate(order.estimatedDelivery)}</p>
          </div>
        </div>

        {/* Current Location */}
        <div className="col-span-2">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Current Location</p>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-gray-500" />
            <p className="text-sm font-medium text-gray-900">{order.currentLocation}</p>
          </div>
        </div>
      </div>

      {/* Progress Timeline */}
      <div className="mb-6">
        <p className="text-xs text-gray-500 uppercase tracking-wide mb-4">Tracking Progress</p>
        <div className="flex items-center justify-between">
          {STATUSES.map((stage, index) => {
            const isCompleted = index < currentStatusIndex || (index === currentStatusIndex && order.status === stage);
            const isCurrent = index === currentStatusIndex;

            return (
              <div key={stage} className="flex flex-col items-center gap-2 flex-1">
                {/* Step Circle */}
                <button
                  onClick={() => handleStatusClick(stage)}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                    isCompleted
                      ? 'bg-blue-600 text-white cursor-pointer hover:bg-blue-700'
                      : isCurrent
                      ? 'bg-blue-100 text-blue-600 border-2 border-blue-600 cursor-pointer'
                      : 'bg-gray-100 text-gray-400'
                  }`}
                  title={`Click to mark as ${stage}`}
                >
                  {isCompleted ? '✓' : ''}
                </button>

                {/* Step Label */}
                <span className={`text-xs text-center font-medium whitespace-nowrap ${
                  isCurrent ? 'text-blue-600' : isCompleted ? 'text-gray-900' : 'text-gray-500'
                }`}>
                  {stage}
                </span>
              </div>
            );
          })}
        </div>

        {/* Connection Line */}
        <div className="flex gap-1 mt-4">
          {STATUSES.map((_, index) => (
            <div
              key={index}
              className={`flex-1 h-1 rounded-full ${
                index < currentStatusIndex ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Tracking History */}
      {order.trackingHistory && order.trackingHistory.length > 0 && (
        <div className="mb-6 pb-6 border-b border-gray-200">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-3">Recent Updates</p>
          <div className="space-y-2">
            {order.trackingHistory.slice(-3).reverse().map((entry, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <div className="w-2 h-2 bg-blue-600 rounded-full" />
                <span className="text-sm text-gray-700">{entry.stage}</span>
                <span className="text-xs text-gray-500">{formatDate(entry.date)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2 justify-end">
        <button
          onClick={() => onEdit && onEdit(order)}
          className="px-3 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition"
        >
          Edit
        </button>
        <button
          onClick={() => onDelete && onDelete(order)}
          className="px-3 py-2 text-sm border border-red-300 text-red-600 rounded-lg hover:bg-red-50 font-medium transition"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
