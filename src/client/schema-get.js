/**
 * Get entity schema or entity fields schema.
 *
 * @param  {string}  [options.entity]         - Entity wanted. If left blank returns all entity schemas.
 * @param  {boolean} [options.isFieldsWanted] - Flag indicating if entity fields schema is wanted instead of entity schema.
 * @param  {number}  [options.projectId]      - Project associated with entity.
 * @return {Object} Schema (fields) definition.
 */
const schemaGet = async function({ entity, isFieldsWanted, projectId }) {

	let path = '/schema';
	if (entity) {
		path += `/${entity}`;
		if (isFieldsWanted) {
			path += '/fields';
		}
	}

	let query = {};
	if (projectId)
		query.project_id = projectId;

	let respBody = await this.request({
		method: 'GET',
		path,
		query,
	});
	return respBody.data;
};

module.exports = schemaGet;
