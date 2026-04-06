const MockDB = require('../config/mockDb');
const { isConnected } = require('../config/db');
const Asset = require('../models/Asset');
const License = require('../models/License');
const InventoryItem = require('../models/InventoryItem');
const Employee = require('../models/Employee');
const EmployeeReport = require('../models/EmployeeReport');
const { createNotification } = require('../services/notificationService');

const normalizeOrgId = (orgId) => String(orgId || '');

const isSameOrg = (item, orgId) => normalizeOrgId(item?.orgId) === normalizeOrgId(orgId);

const mockEmployeeReports = [];

const getMockEmployeeReports = () => mockEmployeeReports;

const createMockEmployeeReport = (payload) => {
  const report = {
    _id: `rep_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    ...payload,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  mockEmployeeReports.push(report);
  return report;
};

const updateMockEmployeeReport = (id, updates) => {
  const report = mockEmployeeReports.find((item) => item._id === id);
  if (!report) return null;
  Object.assign(report, updates, { updatedAt: new Date() });
  return report;
};

const reportsController = {
  getAssetReport: async (req, res) => {
    try {
      const { reportId } = req.query;

      if (isConnected()) {
        const assets = await Asset.find({}).lean();
        res.json({
          data: assets,
          reportId: reportId || 'assets-master',
          generatedAt: new Date()
        });
      } else {
        const assets = MockDB.getAssets();
        res.json({
          data: assets,
          reportId: reportId || 'assets-master',
          generatedAt: new Date()
        });
      }
    } catch (error) {
      console.error('Error generating asset report:', error);
      res.status(500).json({ message: 'Failed to generate report', error: error.message });
    }
  },

  getLicenseReport: async (req, res) => {
    try {
      if (isConnected()) {
        const licenses = await License.find({}).lean();
        res.json({
          data: licenses,
          reportId: 'licenses-master',
          generatedAt: new Date()
        });
      } else {
        const licenses = MockDB.getLicenses();
        res.json({
          data: licenses,
          reportId: 'licenses-master',
          generatedAt: new Date()
        });
      }
    } catch (error) {
      console.error('Error generating license report:', error);
      res.status(500).json({ message: 'Failed to generate report', error: error.message });
    }
  },

  getInventoryReport: async (req, res) => {
    try {
      if (isConnected()) {
        const inventory = await InventoryItem.find({}).lean();
        res.json({
          data: inventory,
          reportId: 'inventory-master',
          generatedAt: new Date()
        });
      } else {
        const inventory = MockDB.getInventoryItems();
        res.json({
          data: inventory,
          reportId: 'inventory-master',
          generatedAt: new Date()
        });
      }
    } catch (error) {
      console.error('Error generating inventory report:', error);
      res.status(500).json({ message: 'Failed to generate report', error: error.message });
    }
  },

  getEmployeeReport: async (req, res) => {
    try {
      if (isConnected()) {
        const employees = await Employee.find({}).lean();
        res.json({
          data: employees,
          reportId: 'employees-master',
          generatedAt: new Date()
        });
      } else {
        const employees = MockDB.getEmployees();
        res.json({
          data: employees,
          reportId: 'employees-master',
          generatedAt: new Date()
        });
      }
    } catch (error) {
      console.error('Error generating employee report:', error);
      res.status(500).json({ message: 'Failed to generate report', error: error.message });
    }
  },

  getTrackingReport: async (req, res) => {
    try {
      // This would return tracking/order information
      res.json({
        data: [],
        reportId: 'tracking-master',
        generatedAt: new Date(),
        message: 'Tracking reports are available through the orders API'
      });
    } catch (error) {
      console.error('Error generating tracking report:', error);
      res.status(500).json({ message: 'Failed to generate report', error: error.message });
    }
  },

  createEmployeeIssueReport: async (req, res) => {
    try {
      if (!req.user || req.user.role !== 'EMPLOYEE') {
        return res.status(403).json({ message: 'Only employees can create reports' });
      }

      const description = String(req.body?.description || '').trim();
      if (!description) {
        return res.status(400).json({ message: 'Description is required' });
      }

      const payload = {
        orgId: req.user.orgId,
        employeeId: req.user._id,
        employeeName: `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() || 'Employee',
        employeeEmail: String(req.user.email || '').toLowerCase(),
        description,
        status: 'OPEN',
        adminFeedback: ''
      };

      if (isConnected()) {
        const created = await EmployeeReport.create(payload);
        await createNotification({
          targetRole: 'ADMIN',
          title: 'New Employee Report',
          message: `${payload.employeeName} submitted a new report.`,
          type: 'REPORT'
        });
        return res.status(201).json({ data: created });
      }

      const created = createMockEmployeeReport(payload);
      await createNotification({
        targetRole: 'ADMIN',
        title: 'New Employee Report',
        message: `${payload.employeeName} submitted a new report.`,
        type: 'REPORT'
      });
      return res.status(201).json({ data: created });
    } catch (error) {
      console.error('Error creating employee issue report:', error);
      res.status(500).json({ message: 'Failed to create employee report', error: error.message });
    }
  },

  getEmployeeIssueReports: async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const { status } = req.query;
      const role = req.user.role;
      const orgId = req.user.orgId;

      if (isConnected()) {
        const query = { orgId };
        if (status) query.status = status;
        if (role === 'EMPLOYEE') query.employeeId = req.user._id;

        const data = await EmployeeReport.find(query)
          .sort({ createdAt: -1 })
          .lean();

        return res.json({ data });
      }

      let data = getMockEmployeeReports().filter((item) => isSameOrg(item, orgId));
      if (status) data = data.filter((item) => item.status === status);
      if (role === 'EMPLOYEE') data = data.filter((item) => String(item.employeeId) === String(req.user._id));
      data = data.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

      return res.json({ data });
    } catch (error) {
      console.error('Error fetching employee issue reports:', error);
      res.status(500).json({ message: 'Failed to fetch employee reports', error: error.message });
    }
  },

  updateEmployeeIssueFeedback: async (req, res) => {
    try {
      if (!req.user || req.user.role !== 'ADMIN') {
        return res.status(403).json({ message: 'Only admin can update feedback' });
      }

      const { id } = req.params;
      const feedback = String(req.body?.adminFeedback || '').trim();
      const status = String(req.body?.status || '').trim().toUpperCase();

      if (!feedback) {
        return res.status(400).json({ message: 'Feedback is required' });
      }

      if (!['OPEN', 'SOLVED'].includes(status)) {
        return res.status(400).json({ message: 'Status must be OPEN or SOLVED' });
      }

      const updates = {
        adminFeedback: feedback,
        status,
        feedbackBy: req.user._id,
        feedbackAt: new Date(),
        updatedAt: new Date()
      };

      if (isConnected()) {
        const updated = await EmployeeReport.findOneAndUpdate(
          { _id: id, orgId: req.user.orgId },
          updates,
          { new: true }
        ).lean();

        if (!updated) {
          return res.status(404).json({ message: 'Employee report not found' });
        }
        await createNotification({
          userId: updated.employeeId,
          title: 'Report Feedback Updated',
          message: `Admin marked your report as ${status === 'SOLVED' ? 'Solved' : 'Open'}.`,
          type: 'FEEDBACK'
        });
        return res.json({ data: updated });
      }

      const existing = getMockEmployeeReports().find((item) => item._id === id);
      if (!existing || !isSameOrg(existing, req.user.orgId)) {
        return res.status(404).json({ message: 'Employee report not found' });
      }

      const updated = updateMockEmployeeReport(id, updates);
      await createNotification({
        userId: updated.employeeId,
        title: 'Report Feedback Updated',
        message: `Admin marked your report as ${status === 'SOLVED' ? 'Solved' : 'Open'}.`,
        type: 'FEEDBACK'
      });
      return res.json({ data: updated });
    } catch (error) {
      console.error('Error updating employee issue feedback:', error);
      res.status(500).json({ message: 'Failed to update feedback', error: error.message });
    }
  },

  createEmployeeResourceRequest: async (req, res) => {
    try {
      if (!req.user || req.user.role !== 'EMPLOYEE') {
        return res.status(403).json({ message: 'Only employees can create requests' });
      }

      const requestType = String(req.body?.requestType || '').trim().toUpperCase();
      const categoryName = String(req.body?.categoryName || '').trim();
      const note = String(req.body?.note || '').trim();

      if (!['ASSET', 'LICENSE'].includes(requestType)) {
        return res.status(400).json({ message: 'requestType must be ASSET or LICENSE' });
      }
      if (!categoryName) {
        return res.status(400).json({ message: 'categoryName is required' });
      }

      const employeeName = `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() || 'Employee';
      const description = `[${requestType} REQUEST] Category: ${categoryName}${note ? ` | Note: ${note}` : ''}`;

      const payload = {
        orgId: req.user.orgId,
        employeeId: req.user._id,
        employeeName,
        employeeEmail: String(req.user.email || '').toLowerCase(),
        description,
        status: 'OPEN',
        adminFeedback: ''
      };

      let created;
      if (isConnected()) {
        created = await EmployeeReport.create(payload);
      } else {
        created = createMockEmployeeReport(payload);
      }

      await createNotification({
        targetRole: 'ADMIN',
        title: `New ${requestType.toLowerCase()} request`,
        message: `${employeeName} requested ${requestType.toLowerCase()} for ${categoryName}.`,
        type: 'REQUEST'
      });

      return res.status(201).json({ data: created });
    } catch (error) {
      console.error('Error creating employee resource request:', error);
      return res.status(500).json({ message: 'Failed to create request', error: error.message });
    }
  }
};

module.exports = reportsController;
