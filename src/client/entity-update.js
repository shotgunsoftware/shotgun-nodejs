/**
 * Update an entity.
 *
 * @param  {string} options.entity   - Entity type.
 * @param  {number} options.entityId - Target entity ID.
 * @param  {Object} options.data     - Entity data.
 * @return {Object} Updated entity.
 */
const entityUpdate = async function({ entity, entityId, data }) {

	let respBody = await this.request({
		method: 'PUT',
		path: `/entity/${entity}/${entityId}`,
		body: data
	});
	return respBody.data;
};

module.exports = entityUpdate;