const { SchemaFieldDefinition } = require('../schema-field-definition');

/**
 * Update an entity schema field.
 *
 * @param  {string}                options.entity                - Entity target.
 * @param  {string}                options.fieldName             - Target field name.
 * @param  {SchemaFieldDefinition} options.schemaFieldDefinition - Field definition.
 * @param  {number}                [options.project]             - Associated project.
 * @return {Object} Operation response data.
 */
const schemaFieldUpdate = async function({ entity, fieldName, schemaFieldDefinition, projectId }) {

	if (!(schemaFieldDefinition instanceof SchemaFieldDefinition))
		schemaFieldDefinition = new SchemaFieldDefinition(schemaFieldDefinition);

	let body = schemaFieldDefinition.toBody();

	if (projectId)
		body.project_id = projectId;

	let respBody = await this.request({
		method: 'PUT',
		path: `/schema/${entity}/fields/${fieldName}`,
		body,
	});
	return respBody.data;
};

module.exports = schemaFieldUpdate;