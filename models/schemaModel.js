/* eslint-disable comma-dangle */
const Joi = require('joi');

const schemas = {};

schemas.httpClient = Joi.object().keys({
	host: Joi.string().min(2).required(),
	path: Joi.string().required(),
	method: Joi.string().valid('GET', 'POST', 'PUT', 'DELETE', 'get', 'post', 'put', 'delete').required(),
	port: Joi.number().min(80).max(65534).required(),
	rejectUnauthorized: Joi.boolean().required(),
	timeout: Joi.number(),
	useTls: Joi.boolean().required(),
	body: Joi.string().allow('').allow(null),
	returnClientRequest: Joi.boolean().required(),
	returnHttpIncomingMessage: Joi.boolean().required(),
	auth: Joi.string().regex(/.+?:.+?/) // Basic authentication i.e. 'user:password'
});

schemas.bigfixAuthentication = Joi.object().keys({
	username: Joi.string().min(2).required(),
	password: Joi.string().min(2).required()
});

schemas.bigfixOperator = Joi.object().keys({
	opName: Joi.string().min(2).required()
});

schemas.hpsmAssignmentGroupName = Joi.object().keys({
	assignmentGroupName: Joi.string().min(2).max(100).required()
});

schemas.hpsmIncidentID = Joi.object().keys({
	IncidentID: Joi.string().min(2).max(20)
});

schemas.hpsmNewIncident = Joi.object().keys({
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
	OUtageEndTime: Joi.date().iso(),
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
	IncidentID: Joi.string().required()
});

schemas.hpsmContacts = Joi.array().items(Joi.array().length(9).items(Joi.string().allow('')));

schemas.hpsmComputers = Joi.array().items(Joi.array().length(19).items(Joi.string().allow('')));

schemas.hpsmPrimaryAffectedServices = Joi.array().items(Joi.array().length(6).items(Joi.string().allow('')));

module.exports = schemas;
