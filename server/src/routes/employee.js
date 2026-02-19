/**
 * Employee Routes - Complete CRUD with proper error handling
 */

const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const employeeController = require('../controllers/employeeController');

const router = express.Router();

// All endpoints require authentication
router.use(authMiddleware);

// GET all employees with search, filters, pagination
router.get('/', employeeController.getEmployees);

// POST create employee
router.post('/', employeeController.createEmployee);

// GET single employee
router.get('/:id', employeeController.getEmployeeById);

// PUT update employee
router.put('/:id', employeeController.updateEmployee);

// DELETE soft delete employee
router.delete('/:id', employeeController.deleteEmployee);

module.exports = router;
