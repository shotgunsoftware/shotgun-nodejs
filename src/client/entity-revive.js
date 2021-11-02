const { ShotgunApiClient } = require('../client');

/**
 * Revive an entity.
 *
 * @param  {string} options.entity - Entity type.
 * @param  {number} options.entityId  - Target entity ID.
 * @return {Object} Revived entity.
 */
ShotgunApiClient.prototype.entityRevive = async function({ entity, entityId }) {

	let respBody = await this.request({
		method: 'POST',
		path: `/entity/${entity}/${entityId}`,
		query: {
			revive: true,
		},
	});
	return respBody.data;
};
