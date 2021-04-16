const express = require('express');

const router = express.Router();
const accessController = require('../controllers/accessController');
const incidentController = require('../controllers/incidentController');

// HPSM Incidents resources
router.post('/', accessController.isAllowed, incidentController.createIncident);
router.put('/', accessController.isAllowed, incidentController.updateIncident);
router.get('/', accessController.isAllowed, incidentController.getAllIncidents);
router.get('/query/:id', accessController.isAllowed, incidentController.getIncidentById);
router.get('/groups', accessController.isAllowed, incidentController.getAssignmentGroups);
router.get('/groups/:groupName', accessController.isAllowed, incidentController.getEligibleAssigneesByGroup);
router.get('/aatypes', accessController.isAllowed, incidentController.getAutoAssignTypes);
router.get('/closurecodes', accessController.isAllowed, incidentController.getClosureCodes);
router.get('/statuses', accessController.isAllowed, incidentController.getStatuses);
router.get('/causecodes', accessController.isAllowed, incidentController.getCauseCodes);
router.get('/areacatsubcat', accessController.isAllowed, incidentController.getAreaCategorySubCategory);
router.get('/primaryservices', accessController.isAllowed, incidentController.getPrimaryAffectedServices);

// HPSM computers resources
router.get('/hpsmcomputers/:computerName', accessController.isAllowed, incidentController.getComputerProperties);
router.get('/hpsmcomputers_json/:computerName', incidentController.getComputerProperties);

// HPSM uploads resources
router.post('/uploads/:contentTag', incidentController.processPayload);

module.exports = router;
