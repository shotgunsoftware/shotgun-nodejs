const { ShotgunApiClient } = require('../client');

/**
 * Delete an entity.
 *
 * @param  {string} options.entity   - Entity type.
 * @param  {number} options.entityId - Target entity ID.
 * @return {Object} Request result.
 */
ShotgunApiClient.prototype.entityDelete = async function({ entity, entityId }) {

	let respBody = await this.request({
		method: 'DELETE',
		path: `/entity/${entity}/${entityId}`,
	});
	return respBody;
};
