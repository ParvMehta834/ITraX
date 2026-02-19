/**
 * Inventory Routes
 */

const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const InventoryController = require('../controllers/inventoryController');

const router = express.Router();

router.use(authMiddleware);

router.get('/', InventoryController.getInventory);
router.post('/', InventoryController.createInventory);
router.get('/:id', InventoryController.getInventoryById);
router.put('/:id', InventoryController.updateInventory);
router.delete('/:id', InventoryController.deleteInventory);

module.exports = router;
