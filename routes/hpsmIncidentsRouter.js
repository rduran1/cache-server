const express = require('express');

const router = express.Router();
const accessController = require('../controllers/accessController');
const hpsmIncidentController = require('../controllers/hpsmIncidentController');

// HPSM Incidents resources
router.post('/', accessController.isAllowed, hpsmIncidentController.createIncident);
router.put('/', accessController.isAllowed, hpsmIncidentController.updateIncident);
router.get('/', accessController.isAllowed, hpsmIncidentController.getAllIncidents);
router.get('/query/:id', accessController.isAllowed, hpsmIncidentController.getIncidentById);
router.get('/groups', accessController.isAllowed, hpsmIncidentController.getAssignmentGroups);
router.get('/groups/:groupName', accessController.isAllowed, hpsmIncidentController.getEligibleAssigneesByGroup);
router.get('/aatypes', accessController.isAllowed, hpsmIncidentController.getAutoAssignTypes);
router.get('/closurecodes', accessController.isAllowed, hpsmIncidentController.getClosureCodes);
router.get('/statuses', accessController.isAllowed, hpsmIncidentController.getStatuses);
router.get('/causecodes', accessController.isAllowed, hpsmIncidentController.getCauseCodes);
router.get('/areacatsubcat', accessController.isAllowed, hpsmIncidentController.getAreaCategorySubCategory);
router.get('/primaryservices', accessController.isAllowed, hpsmIncidentController.getPrimaryAffectedServices);

// HPSM computers resources
router.get('/hpsmcomputers/:computerName', accessController.isAllowed, hpsmIncidentController.getComputerProperties);
router.get('/hpsmcomputers_json/:computerName', hpsmIncidentController.getComputerProperties);

// HPSM uploads resources
router.post('/uploads/:contentTag', accessController.isAllowed, hpsmIncidentController.processPayload);

module.exports = router;
