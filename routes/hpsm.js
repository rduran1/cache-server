const express		 	 = require('express');
const router		 	 = express.Router();
const accessController	 = require('../controllers/accessController');
const incidentController = require('../controllers/incidentController');

// HPSM Incidents resources
router.post('/incidents', 					accessController.isAllowed, incidentController.createIncident);
router.put( '/incidents', 					accessController.isAllowed, incidentController.updateIncident);
router.get( '/incidents', 					accessController.isAllowed, incidentController.getAllIncidents);
router.get( '/incidents/query/:id', 		accessController.isAllowed, incidentController.getIncidentById); 
router.get( '/incidents/groups',			accessController.isAllowed, incidentController.getAssignmentGroups);
router.get( '/incidents/groups/:groupName', accessController.isAllowed, incidentController.getEligibleAssigneesByGroup);
router.get( '/incidents/aatypes',			accessController.isAllowed, incidentController.getAutoAssignTypes);
router.get( '/incidents/closurecodes',		accessController.isAllowed, incidentController.getClosureCodes);
router.get( '/incidents/statuses',			accessController.isAllowed, incidentController.getStatuses);
router.get( '/incidents/causecodes',		accessController.isAllowed, incidentController.getCauseCodes);
router.get( '/incidents/areacatsubcat',		accessController.isAllowed, incidentController.getAreaCategorySubCategory);
router.get( '/incidents/primaryservices',	accessController.isAllowed, incidentController.getPrimaryAffectedServices);

// HPSM computers resources
router.get('/hpsmcomputers/:computerName', 	accessController.isAllowed, incidentController.getComputerProperties);
router.get('/hpsmcomputers_json/:computerName',  incidentController.getComputerProperties);

// HPSM uploads resources
router.post('/uploads/:contentTag', incidentController.processPayload);

module.exports = router;
