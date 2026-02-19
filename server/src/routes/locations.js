/**
 * Location Routes
 */

const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const locationController = require('../controllers/locationController');

const router = express.Router();

router.use(authMiddleware);

router.get('/', locationController.getLocations);
router.post('/', locationController.createLocation);
router.get('/:id', locationController.getLocationById);
router.put('/:id', locationController.updateLocation);
router.delete('/:id', locationController.deleteLocation);

module.exports = router;

