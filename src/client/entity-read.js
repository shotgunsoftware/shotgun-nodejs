const { ShotgunApiClient } = require('../client');

/**
 * Read a specific entity.
 *
 * @param  {string} options.entity   - Entity type.
 * @param  {number} options.entityId - Target entity ID.
 * @return {Object} Entity information.
 */
ShotgunApiClient.prototype.entityRead = async function({ entity, entityId }) {

	let respBody = await this.request({
		method: 'GET',
		path: `/entity/${entity}/${entityId}`,
	});
	return respBody.data;
};
