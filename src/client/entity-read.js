/**
 * Read a specific entity.
 *
 * @param  {string}       options.entity    - Entity type.
 * @param  {number}       options.entityId  - Target entity ID.
 * @param  {Array|String} [options.fields]  - List of fields to show.
 * @param  {Object}       [options.options] - Request option settings.
 * @return {Object} Entity information.
 */
const entityRead = async function({ entity, entityId, fields, options }) {

	let query = {};

	if (Array.isArray(fields))
		fields = fields.join(',');
	if (fields)
		query.fields = fields;

	if (options) {
		query.options = options;
	}

	let respBody = await this.request({
		method: 'GET',
		path: `/entity/${entity}/${entityId}`,
		query,
	});
	return respBody.data;
};

module.exports = entityRead ;