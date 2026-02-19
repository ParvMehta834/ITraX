/**
 * License Routes
 */

const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const LicenseController = require('../controllers/licenseController');

const router = express.Router();

router.use(authMiddleware);

router.get('/', LicenseController.getLicenses);
router.post('/', LicenseController.createLicense);
router.get('/:id', LicenseController.getLicenseById);
router.put('/:id', LicenseController.updateLicense);
router.delete('/:id', LicenseController.deleteLicense);

module.exports = router;

