const { ShotgunApiClient } = require('../client');

/**
 * Update an entity.
 *
 * @param  {string} options.entity   - Entity type.
 * @param  {number} options.entityId - Target entity ID.
 * @param  {Object} options.data     - Entity data.
 * @return {Object} Updated entity.
 */
ShotgunApiClient.prototype.entityUpdate = async function({ entity, entityId, data }) {

	let respBody = await this.request({
		method: 'PUT',
		path: `/entity/${entity}/${entityId}`,
		body: data
	});
	return respBody.data;
};
