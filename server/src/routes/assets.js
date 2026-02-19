/**
 * Asset Routes - Complete CRUD with proper error handling
 */

const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const assetController = require('../controllers/assetController');

const router = express.Router();

// All endpoints require authentication
router.use(authMiddleware);

// Export route (MUST be before /:id since :id could match "export")
router.get('/export/download', assetController.exportAssets);

// GET all assets with search, filters, pagination
router.get('/', assetController.getAssets);

// POST create asset
router.post('/', assetController.createAsset);

// GET single asset
router.get('/:id', assetController.getAssetById);

// PUT update asset
router.put('/:id', assetController.updateAsset);

// DELETE soft delete asset
router.delete('/:id', assetController.deleteAsset);

module.exports = router;
