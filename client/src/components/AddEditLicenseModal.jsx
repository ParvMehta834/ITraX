import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import licensesService from '../services/licensesService';

export default function AddEditLicenseModal({ isOpen, onClose, onSuccess, license = null }) {
  const [formData, setFormData] = useState({
    name: '',
    seats: '',
    renewalDate: '',
    cost: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Populate form when editing
  useEffect(() => {
    if (license) {
      const renewalDateStr = license.renewalDate
        ? new Date(license.renewalDate).toISOString().split('T')[0]
        : '';
      setFormData({
        name: license.name || '',
        seats: license.seats || '',
        renewalDate: renewalDateStr,
        cost: license.cost || ''
      });
    } else {
      setFormData({
        name: '',
        seats: '',
        renewalDate: '',
        cost: ''
      });
    }
    setErrors({});
  }, [license, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'License name is required';
    }

    if (!formData.seats || formData.seats < 1) {
      newErrors.seats = 'Number of seats must be at least 1';
    }

    if (!formData.renewalDate) {
      newErrors.renewalDate = 'Renewal date is required';
    }

    if (formData.cost === '' || formData.cost < 0) {
      newErrors.cost = 'Cost must be 0 or greater';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    setLoading(true);
    try {
      const data = {
        name: formData.name.trim(),
        seats: parseInt(formData.seats, 10),
        renewalDate: formData.renewalDate,
        cost: parseFloat(formData.cost)
      };

      if (license) {
        await licensesService.updateLicense(license._id, data);
      } else {
        await licensesService.createLicense(data);
      }

      onSuccess();
      onClose();
    } catch (error) {
      const status = error.response?.status;
      if (status === 401) {
        setErrors({ submit: 'You must be logged in to perform this action' });
      } else {
        setErrors({ submit: error.response?.data?.message || 'Failed to save license' });
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {license ? 'Edit License' : 'Add License'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                License Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g., Microsoft Office 365"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>

            {/* Seats */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Number of Seats *
              </label>
              <input
                type="number"
                name="seats"
                value={formData.seats}
                onChange={handleChange}
                min="1"
                step="1"
                placeholder="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.seats && <p className="text-red-500 text-xs mt-1">{errors.seats}</p>}
            </div>

            {/* Renewal Date & Cost Row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Renewal Date *
                </label>
                <input
                  type="date"
                  name="renewalDate"
                  value={formData.renewalDate}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors.renewalDate && <p className="text-red-500 text-xs mt-1">{errors.renewalDate}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  License Cost ($) *
                </label>
                <input
                  type="number"
                  name="cost"
                  value={formData.cost}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors.cost && <p className="text-red-500 text-xs mt-1">{errors.cost}</p>}
              </div>
            </div>

            {/* Submit Error */}
            {errors.submit && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                {errors.submit}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
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
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : license ? 'Update License' : 'Add License'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
