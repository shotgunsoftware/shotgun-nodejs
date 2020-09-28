const { ShotgunApiClient } = require('../client');
const { SchemaFieldDefinition } = require('../schema-field-definition');

/**
 * Create an entity schema field.
 *
 * @param  {string}                options.entity                - Entity target.
 * @param  {SchemaFieldDefinition} options.schemaFieldDefinition - Field definition.
 * @return {Object} Schema (fields) definition.
 */
ShotgunApiClient.prototype.schemaFieldCreate = async function({ entity, schemaFieldDefinition }) {

	if (!(schemaFieldDefinition instanceof SchemaFieldDefinition))
		schemaFieldDefinition = new SchemaFieldDefinition(schemaFieldDefinition);

	let body = schemaFieldDefinition.toBody();

	let respBody = await this.request({
		method: 'POST',
		path: `/schema/${entity}/fields`,
		body,
	});
	return respBody.data;
};
