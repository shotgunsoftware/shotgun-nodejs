const { ShotgunApiClient } = require('../client');

/**
 * Create an entity.
 *
 * @param  {string} options.entity - Entity type.
 * @param  {Object} options.data   - Entity data.
 * @return {Object} Created entity.
 */
ShotgunApiClient.prototype.entityCreate = async function({ entity, data }) {

	let respBody = await this.request({
		method: 'POST',
		path: `/entity/${entity}`,
		body: data
	});
	return respBody.data;
};
