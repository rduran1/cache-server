const Joi = require('joi');
// const { serviceFileName } = require('./globalSchema');

const schemas = {};

schemas.hpsmIncidentService_serviceAccount = Joi.object().keys({
	host: Joi.string().required(),
	port: Joi.number().min(80).max(65534),
	username: Joi.string().required(),
	password: Joi.string().required(),
	useTls: Joi.boolean().default(true),
	rejectUnauthorized: Joi.boolean().default(false),
	keyFileName: Joi.string(),
	certFileName: Joi.string()
})
	.with('keyFileName', 'certFileName')
	.with('certFileName', 'keyFileName');

schemas.hpsmIncidentService_assignmentGroupName = Joi.object().keys({
	assignmentGroupName: Joi.string().min(2).max(100).required()
});

schemas.hpsmIncidentService_incidentId = Joi.object().keys({
	IncidentID: Joi.string().min(2).max(20).required()
});

schemas.hpsmIncidentService_incident = Joi.object().keys({
	Area: Joi.string().required(),
	AssignmentGroup: Joi.string().required(),
	Assignee: Joi.when('Status', {
		is: Joi.string().valid('Resolved', 'Closed'),
		then: Joi.string().required(),
		otherwise: Joi.string()
	}),
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
	Status: Joi.string().required().invalid('Open'),
	JournalUpdates: Joi.string(),
	OutageStartTime: Joi.date().iso(),
	OutageEndTime: Joi.when('Status', {
		is: Joi.string().exist().valid('Resolved', 'Closed'),
		then: Joi.date().iso().greater(Joi.ref('OutageStartTime')).required(),
		otherwise: Joi.date().iso().greater(Joi.ref('OutageStartTime'))
	}),
	Phase: Joi.string(),
	Priority: Joi.string(),
	IncidentID: Joi.string(),
	CauseCode: Joi.when('Status', {
		is: Joi.string().exist().valid('Resolved', 'Closed'),
		then: Joi.string().required(),
		otherwise: Joi.string()
	}),
	Solution: Joi.when('Status', {
		is: Joi.string().exist().valid('Resolved', 'Closed'),
		then: Joi.string().required(),
		otherwise: Joi.string()
	}),
	ClosureCode: Joi.when('Status', {
		is: Joi.string().exist().valid('Closed'),
		then: Joi.string().required(),
		otherwise: Joi.string()
	})
})
	.with('OutageEndTime', 'OutageStartTime');

schemas.hpsmIncidentService_contacts = Joi.array().items(Joi.array().length(9).items(Joi.string().allow('')));

schemas.hpsmIncidentService_computers = Joi.array().items(Joi.array().length(19).items(Joi.string().allow('')));

schemas.hpsmIncidentService_primaryAffectedServices = Joi.array().items(Joi.array().length(6).items(Joi.string().allow('')));

module.exports = schemas;
