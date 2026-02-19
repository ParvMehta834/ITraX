const MockDB = require('../config/mockDb');
const { isConnected } = require('../config/db');
const Employee = require('../models/Employee');

const employeeController = {
  getEmployees: async (req, res) => {
    try {
      const { search, status, page = 1, limit = 10 } = req.query;

      if (isConnected()) {
        let query = {};
        if (search) {
          query.$or = [
            { firstName: { $regex: search, $options: 'i' } },
            { lastName: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } }
          ];
        }
        if (status) query.status = status;

        const total = await Employee.countDocuments(query);
        const data = await Employee.find(query)
          .limit(parseInt(limit))
          .skip((parseInt(page) - 1) * parseInt(limit))
          .lean();

        res.json({
          data,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / parseInt(limit))
          }
        });
      } else {
        const employees = MockDB.getEmployees();
        let filtered = employees;

        if (search) {
          const searchLower = search.toLowerCase();
          filtered = filtered.filter(e =>
            e.firstName?.toLowerCase().includes(searchLower) ||
            e.lastName?.toLowerCase().includes(searchLower) ||
            e.email?.toLowerCase().includes(searchLower)
          );
        }
        if (status) filtered = filtered.filter(e => e.status === status);

        const total = filtered.length;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const data = filtered.slice((pageNum - 1) * limitNum, pageNum * limitNum);

        res.json({
          data,
          pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            pages: Math.ceil(total / limitNum)
          }
        });
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
      res.status(500).json({ message: 'Failed to fetch employees', error: error.message });
    }
  },

  createEmployee: async (req, res) => {
    try {
      const { firstName, lastName, email, department, designation, status, phone } = req.body;

      if (!firstName || !lastName || !email) {
        return res.status(400).json({ message: 'First name, last name, and email are required' });
      }

      if (isConnected()) {
        const employee = await Employee.create({
          firstName,
          lastName,
          email,
          department,
          designation,
          status: status || 'Active',
          phone,
          createdAt: new Date()
        });
        res.status(201).json(employee);
      } else {
        const employee = MockDB.createEmployee({
          firstName,
          lastName,
          email,
          department,
          designation,
          status: status || 'Active',
          phone
        });
        res.status(201).json(employee);
      }
    } catch (error) {
      console.error('Error creating employee:', error);
      res.status(500).json({ message: 'Failed to create employee', error: error.message });
    }
  },

  getEmployeeById: async (req, res) => {
    try {
      const { id } = req.params;

      if (isConnected()) {
        const employee = await Employee.findById(id).lean();
        if (!employee) return res.status(404).json({ message: 'Employee not found' });
        res.json(employee);
      } else {
        const employee = MockDB.getEmployeeById(id);
        if (!employee) return res.status(404).json({ message: 'Employee not found' });
        res.json(employee);
      }
    } catch (error) {
      console.error('Error fetching employee:', error);
      res.status(500).json({ message: 'Failed to fetch employee', error: error.message });
    }
  },

  updateEmployee: async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      if (isConnected()) {
        const employee = await Employee.findByIdAndUpdate(id, { ...updates, updatedAt: new Date() }, { new: true }).lean();
        if (!employee) return res.status(404).json({ message: 'Employee not found' });
        res.json(employee);
      } else {
        const employee = MockDB.updateEmployee(id, updates);
        if (!employee) return res.status(404).json({ message: 'Employee not found' });
        res.json(employee);
      }
    } catch (error) {
      console.error('Error updating employee:', error);
      res.status(500).json({ message: 'Failed to update employee', error: error.message });
    }
  },

  deleteEmployee: async (req, res) => {
    try {
      const { id } = req.params;

      if (isConnected()) {
        const employee = await Employee.findByIdAndDelete(id);
        if (!employee) return res.status(404).json({ message: 'Employee not found' });
        res.json({ message: 'Employee deleted successfully' });
      } else {
        const employee = MockDB.deleteEmployee(id);
        if (!employee) return res.status(404).json({ message: 'Employee not found' });
        res.json({ message: 'Employee deleted successfully' });
      }
    } catch (error) {
      console.error('Error deleting employee:', error);
      res.status(500).json({ message: 'Failed to delete employee', error: error.message });
    }
  }
};

module.exports = employeeController;
