const MockDB = require('../config/mockDb');
const { isConnected } = require('../config/db');
const Asset = require('../models/Asset');

const normalizeRole = (role) => String(role || '').trim().toUpperCase();

const normalizeText = (value) => String(value || '').trim().toLowerCase();

const normalizeOrgId = (value) => String(value || '');

const buildEmployeeVisibilityQuery = (user) => {
  const fullName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim();
  const employeeCode = String(user?.employeeCode || '').trim();

  const visibility = [{ assignedToEmployeeId: user?._id }];

  if (fullName) {
    visibility.push({
      currentEmployee: { $regex: `^${fullName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' },
    });
  }

  if (employeeCode) {
    visibility.push({
      currentEmployee: { $regex: `(^|\\b)${employeeCode.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\\b|$)`, $options: 'i' },
    });
  }

  return { $or: visibility };
};

const isMockAssetVisibleToEmployee = (asset, user) => {
  if (String(asset.assignedToEmployeeId || '') === String(user?._id || '')) return true;

  const fullName = normalizeText(`${user?.firstName || ''} ${user?.lastName || ''}`);
  const currentEmployee = normalizeText(asset.currentEmployee);
  if (fullName && currentEmployee === fullName) return true;

  const employeeCode = normalizeText(user?.employeeCode);
  if (employeeCode && currentEmployee.includes(employeeCode)) return true;

  return false;
};

const assetController = {
  getAssets: async (req, res) => {
    try {
      const { search, status, category, location, page = 1, limit = 10 } = req.query;
      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const limitNum = Math.max(1, parseInt(limit, 10) || 10);
      const role = normalizeRole(req.user?.role);

      if (isConnected()) {
        const query = {
          orgId: req.user.orgId,
          isDeleted: { $ne: true },
        };

        if (role === 'EMPLOYEE') {
          query.$and = [buildEmployeeVisibilityQuery(req.user)];
        }

        if (search) {
          const searchFilter = {
            $or: [
              { name: { $regex: search, $options: 'i' } },
              { assetTag: { $regex: search, $options: 'i' } },
              { description: { $regex: search, $options: 'i' } },
              { currentEmployee: { $regex: search, $options: 'i' } },
            ],
          };

          if (query.$and) query.$and.push(searchFilter);
          else query.$or = searchFilter.$or;
        }

        if (status) query.status = status;
        if (category) query.category = { $regex: category, $options: 'i' };
        if (location) query.currentLocation = { $regex: location, $options: 'i' };

        const total = await Asset.countDocuments(query);
        const data = await Asset.find(query)
          .sort({ createdAt: -1 })
          .limit(limitNum)
          .skip((pageNum - 1) * limitNum)
          .lean();

        return res.json({
          data,
          pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            pages: Math.ceil(total / limitNum) || 1,
          },
        });
      }

      const orgId = normalizeOrgId(req.user?.orgId);
      let filtered = MockDB.getAssets().filter((asset) => normalizeOrgId(asset.orgId) === orgId);

      if (role === 'EMPLOYEE') {
        filtered = filtered.filter((asset) => isMockAssetVisibleToEmployee(asset, req.user));
      }

      if (search) {
        const searchLower = String(search).toLowerCase();
        filtered = filtered.filter((a) =>
          a.name?.toLowerCase().includes(searchLower) ||
          a.assetTag?.toLowerCase().includes(searchLower) ||
          a.description?.toLowerCase().includes(searchLower) ||
          a.currentEmployee?.toLowerCase().includes(searchLower)
        );
      }

      if (status) filtered = filtered.filter((a) => a.status === status);
      if (category) filtered = filtered.filter((a) => String(a.category || '').toLowerCase().includes(String(category).toLowerCase()));
      if (location) {
        const locationLower = String(location).toLowerCase();
        filtered = filtered.filter((a) => String(a.currentLocation || a.location || '').toLowerCase().includes(locationLower));
      }

      const total = filtered.length;
      const data = filtered.slice((pageNum - 1) * limitNum, pageNum * limitNum);

      return res.json({
        data,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum) || 1,
        },
      });
    } catch (error) {
      console.error('Error fetching assets:', error);
      return res.status(500).json({ message: 'Failed to fetch assets', error: error.message });
    }
  },

  createAsset: async (req, res) => {
    try {
      const {
        assetId,
        category,
        manufacturer,
        model,
        serialNumber,
        status,
        currentEmployee,
        currentLocation,
        purchaseDate,
        warrantyExpiryDate,
        notes,
        assignedToEmployeeId,
      } = req.body;

      if (!assetId) {
        return res.status(400).json({ message: 'Asset ID is required' });
      }

      const normalizedEmployeeName = String(currentEmployee || '').trim();
      const normalizedAssignedEmployeeId = assignedToEmployeeId || null;
      const normalizedStatus = normalizedAssignedEmployeeId ? 'Assigned' : (status || 'Available');

      if (isConnected()) {
        const asset = await Asset.create({
          orgId: req.user.orgId,
          createdBy: req.user._id,
          assetId,
          name: assetId || manufacturer || 'Unnamed Asset',
          assetTag: assetId,
          notes,
          category,
          manufacturer,
          model,
          serialNumber: serialNumber || `SN-${assetId}`,
          status: normalizedStatus,
          currentLocation,
          currentEmployee: normalizedEmployeeName,
          assignedToEmployeeId: normalizedAssignedEmployeeId,
          purchaseDate,
          warrantyExpiryDate,
          createdAt: new Date(),
        });

        return res.status(201).json({ data: asset });
      }

      const asset = MockDB.createAsset({
        orgId: req.user.orgId,
        assetId,
        name: assetId || manufacturer || 'Unnamed Asset',
        assetTag: assetId,
        description: notes,
        category,
        manufacturer,
        model,
        status: normalizedStatus,
        currentLocation,
        currentEmployee: normalizedEmployeeName,
        assignedToEmployeeId: normalizedAssignedEmployeeId,
        purchaseDate,
        warrantyExpiryDate,
      });

      return res.status(201).json({ data: asset });
    } catch (error) {
      console.error('Error creating asset:', error);
      return res.status(500).json({ message: 'Failed to create asset', error: error.message });
    }
  },

  getAssetById: async (req, res) => {
    try {
      const { id } = req.params;
      const role = normalizeRole(req.user?.role);

      if (isConnected()) {
        const query = { _id: id, orgId: req.user.orgId, isDeleted: { $ne: true } };
        if (role === 'EMPLOYEE') {
          query.$and = [buildEmployeeVisibilityQuery(req.user)];
        }

        const asset = await Asset.findOne(query).lean();
        if (!asset) return res.status(404).json({ message: 'Asset not found' });
        return res.json({ data: asset });
      }

      const asset = MockDB.getAssetById(id);
      if (!asset || normalizeOrgId(asset.orgId) !== normalizeOrgId(req.user?.orgId)) {
        return res.status(404).json({ message: 'Asset not found' });
      }
      if (role === 'EMPLOYEE' && !isMockAssetVisibleToEmployee(asset, req.user)) {
        return res.status(404).json({ message: 'Asset not found' });
      }

      return res.json({ data: asset });
    } catch (error) {
      console.error('Error fetching asset:', error);
      return res.status(500).json({ message: 'Failed to fetch asset', error: error.message });
    }
  },

  updateAsset: async (req, res) => {
    try {
      const { id } = req.params;
      const updates = { ...req.body };

      if (Object.prototype.hasOwnProperty.call(updates, 'assignedToEmployeeId')) {
        updates.assignedToEmployeeId = updates.assignedToEmployeeId || null;
      }
      if (updates.assignedToEmployeeId) {
        updates.status = 'Assigned';
      }

      if (isConnected()) {
        const asset = await Asset.findOneAndUpdate(
          { _id: id, orgId: req.user.orgId, isDeleted: { $ne: true } },
          { ...updates, updatedAt: new Date(), updatedBy: req.user._id },
          { new: true }
        ).lean();

        if (!asset) return res.status(404).json({ message: 'Asset not found' });
        return res.json({ data: asset });
      }

      const existing = MockDB.getAssetById(id);
      if (!existing || normalizeOrgId(existing.orgId) !== normalizeOrgId(req.user?.orgId)) {
        return res.status(404).json({ message: 'Asset not found' });
      }

      const asset = MockDB.updateAsset(id, updates);
      return res.json({ data: asset });
    } catch (error) {
      console.error('Error updating asset:', error);
      return res.status(500).json({ message: 'Failed to update asset', error: error.message });
    }
  },

  deleteAsset: async (req, res) => {
    try {
      const { id } = req.params;

      if (isConnected()) {
        const asset = await Asset.findOneAndDelete({ _id: id, orgId: req.user.orgId });
        if (!asset) return res.status(404).json({ message: 'Asset not found' });
        return res.json({ message: 'Asset deleted successfully' });
      }

      const existing = MockDB.getAssetById(id);
      if (!existing || normalizeOrgId(existing.orgId) !== normalizeOrgId(req.user?.orgId)) {
        return res.status(404).json({ message: 'Asset not found' });
      }

      MockDB.deleteAsset(id);
      return res.json({ message: 'Asset deleted successfully' });
    } catch (error) {
      console.error('Error deleting asset:', error);
      return res.status(500).json({ message: 'Failed to delete asset', error: error.message });
    }
  },

  exportAssets: async (req, res) => {
    try {
      const role = normalizeRole(req.user?.role);
      let assets = [];

      if (isConnected()) {
        const query = { orgId: req.user.orgId, isDeleted: { $ne: true } };
        if (role === 'EMPLOYEE') {
          query.$and = [buildEmployeeVisibilityQuery(req.user)];
        }
        assets = await Asset.find(query).lean();
      } else {
        const orgId = normalizeOrgId(req.user?.orgId);
        assets = MockDB.getAssets().filter((asset) => normalizeOrgId(asset.orgId) === orgId);
        if (role === 'EMPLOYEE') {
          assets = assets.filter((asset) => isMockAssetVisibleToEmployee(asset, req.user));
        }
      }

      const csv = convertToCSV(assets);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=assets.csv');
      return res.send(csv);
    } catch (error) {
      console.error('Error exporting assets:', error);
      return res.status(500).json({ message: 'Failed to export assets', error: error.message });
    }
  },
};

function convertToCSV(data) {
  if (!data || data.length === 0) return '';
  const headers = Object.keys(data[0]);
  const csv = [headers.join(',')];
  for (const row of data) {
    csv.push(headers.map((h) => JSON.stringify(row[h] || '')).join(','));
  }
  return csv.join('\n');
}

module.exports = assetController;
