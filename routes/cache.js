const express = require('express');

const router = express.Router();
const accessController = require('../controllers/accessController');
const collectionController = require('../controllers/collectionController');

router.post('/collections/create', accessController.isAllowed, collectionController.getIncidentById);
router.post('/collections/stop/:id', accessController.isAllowed, collectionController.updateIncident);
router.post('/collections/start/:id', accessController.isAllowed, collectionController.createIncident);
router.get('/collections/query/:id', accessController.isAllowed, collectionController.getIncidentById);
router.get('/collections/getall', accessController.isAllowed, collectionController.getAllIncidents);
router.put('/collections/update', accessController.isAllowed, collectionController.getIncidentById);
router.delete('/collections/:id', accessController.isAllowed, collectionController.getAssignmentGroups);

module.exports = router;
