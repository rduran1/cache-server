const Joi = require('joi');
// const { serviceFileName } = require('./globals');

const schemas = {};

schemas.hpsmIncidentService_assignmentGroupName = Joi.object().keys({
	assignmentGroupName: Joi.string().min(2).max(100).required()
});

schemas.hpsmIncidentService_incidentId = Joi.object().keys({
	IncidentId: Joi.string().min(2).max(20)
});

schemas.hpsmIncidentService_incident = Joi.object().keys({
	Area: Joi.string().required(),
	AssignmentGroup: Joi.string().required(),
	Assignee: Joi.string(),
	Subcategory: Joi.string().required(),
	AutoAssignType: Joi.string().required(),
	AffectedCI: Joi.string().required(),
	Category: Joi.string().required().allow(''),
	Contact: Joi.string().required(),
	Description: Joi.string().required(),
	Impact: Joi.string().required().valid('3', '4', '5'),
	Service: Joi.string().required(),
	Title: Joi.string().required(),
	Urgency: Joi.string().required().valid('3', '4', '5'),
	Status: Joi.string(),
	JournalUpdates: Joi.string()
});

schemas.hpsmExistingIncident = Joi.object().keys({
	Area: Joi.string(),
	AssignmentGroup: Joi.string(),
	Assignee: Joi.string(),
	AutoAssignType: Joi.string(),
	Subcategory: Joi.string().required(),
	OutageStartTime: Joi.date().iso(),
	OutageEndTime: Joi.date().iso(),
	AffectedCI: Joi.string().required(),
	Phase: Joi.string(),
	Priority: Joi.string(),
	JournalUpdates: Joi.string().required(),
	Category: Joi.string().required().allow(''),
	Contact: Joi.string().required(),
	Description: Joi.string().required(),
	Impact: Joi.string().required().valid('3', '4', '5'),
	Service: Joi.string().required(),
	Title: Joi.string().required(),
	Urgency: Joi.string().required().valid('3', '4', '5'),
	Status: Joi.string(),
	IncidentID: Joi.string().required(),
	CauseCode: Joi.string(),
	Solution: Joi.string(),
	ClosureCode: Joi.string()
});

schemas.hpsmContacts = Joi.array().items(Joi.array().length(9).items(Joi.string().allow('')));

schemas.hpsmComputers = Joi.array().items(Joi.array().length(19).items(Joi.string().allow('')));

schemas.hpsmPrimaryAffectedServices = Joi.array().items(Joi.array().length(6).items(Joi.string().allow('')));

schemas.bigfixService_operator = Joi.object().keys({
	opName: Joi.string().min(2).required()
});

module.exports = schemas;
