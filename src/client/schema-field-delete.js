const { ShotgunApiClient } = require('../client');

/**
 * Delete an entity schema field.
 *
 * @param  {string} options.entity    - Entity target.
 * @param  {string} options.fieldName - Target field name.
 * @return {Object} Operation response data.
 */
ShotgunApiClient.prototype.schemaFieldDelete = async function({ entity, fieldName }) {

	let respBody = await this.request({
		method: 'DELETE',
		path: `/schema/${entity}/fields/${fieldName}`,
	});
	return respBody;
};
