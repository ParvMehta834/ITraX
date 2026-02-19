import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import inventoryService from '../services/inventoryService';

export default function AddEditInventoryModal({ isOpen, onClose, onSuccess, item = null }) {
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    quantityOnHand: '',
    quantityMinimum: '',
    costPerItem: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);

  // Populate form when editing
  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name || '',
        location: item.location || '',
        quantityOnHand: item.quantityOnHand || '',
        quantityMinimum: item.quantityMinimum || '',
        costPerItem: item.costPerItem || ''
      });
    } else {
      setFormData({
        name: '',
        location: '',
        quantityOnHand: '',
        quantityMinimum: '',
        costPerItem: ''
      });
    }
    setErrors({});
  }, [item, isOpen]);

  // Auto-calculate total
  useEffect(() => {
    const qty = parseFloat(formData.quantityOnHand) || 0;
    const cost = parseFloat(formData.costPerItem) || 0;
    setTotal(qty * cost);
  }, [formData.quantityOnHand, formData.costPerItem]);

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
      newErrors.name = 'Name is required';
    }
    
    if (!formData.location.trim()) {
      newErrors.location = 'Location is required';
    }
    
    if (formData.quantityOnHand === '' || formData.quantityOnHand < 0) {
      newErrors.quantityOnHand = 'Quantity on hand must be 0 or greater';
    }
    
    if (formData.quantityMinimum === '' || formData.quantityMinimum < 0) {
      newErrors.quantityMinimum = 'Minimum quantity must be 0 or greater';
    }
    
    if (formData.costPerItem === '' || formData.costPerItem < 0) {
      newErrors.costPerItem = 'Cost per item must be 0 or greater';
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
        location: formData.location.trim(),
        quantityOnHand: parseFloat(formData.quantityOnHand),
        quantityMinimum: parseFloat(formData.quantityMinimum),
        costPerItem: parseFloat(formData.costPerItem)
      };
      
      if (item) {
        await inventoryService.updateItem(item._id, data);
      } else {
        await inventoryService.createItem(data);
      }
      
      onSuccess();
      onClose();
    } catch (error) {
      setErrors({ submit: error.response?.data?.message || 'Failed to save item' });
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
            {item ? 'Edit Inventory Item' : 'Add Inventory Item'}
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
                Item Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g., Office Supplies - Pens"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location *
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="e.g., Warehouse A, Office Floor 2"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.location && <p className="text-red-500 text-xs mt-1">{errors.location}</p>}
            </div>

            {/* Quantity Row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantity on Hand *
                </label>
                <input
                  type="number"
                  name="quantityOnHand"
                  value={formData.quantityOnHand}
                  onChange={handleChange}
                  min="0"
                  step="1"
                  placeholder="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors.quantityOnHand && <p className="text-red-500 text-xs mt-1">{errors.quantityOnHand}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Minimum Quantity *
                </label>
                <input
                  type="number"
                  name="quantityMinimum"
                  value={formData.quantityMinimum}
                  onChange={handleChange}
                  min="0"
                  step="1"
                  placeholder="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors.quantityMinimum && <p className="text-red-500 text-xs mt-1">{errors.quantityMinimum}</p>}
              </div>
            </div>

            {/* Cost Per Item */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cost per Item *
              </label>
              <input
                type="number"
                name="costPerItem"
                value={formData.costPerItem}
                onChange={handleChange}
                min="0"
                step="0.01"
                placeholder="0.00"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.costPerItem && <p className="text-red-500 text-xs mt-1">{errors.costPerItem}</p>}
            </div>

            {/* Total (Auto-calculated) */}
            <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Total Value:</span>
                <span className="text-lg font-semibold text-gray-900">
                  ${total.toFixed(2)}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Calculated as: Quantity on Hand × Cost per Item
              </p>
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
              {loading ? 'Saving...' : item ? 'Update Item' : 'Add Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
