const { ShotgunApiClient } = require('../client');
const { PaginatedRecordResponse } = require('../paginated-record-response');

/**
 * Read multiple entities.
 *
 * @param  {string}   options.entity       - Entity type.
 * @param  {Object}   [options.fields]     - List of fields to show.
 * @param  {Object}   [options.filter]     - List of filters.
 * @param  {number}   [options.pageSize]   - Upper limit of items shown on response page.
 * @param  {number}   [options.pageNumber] - Position in list of items to start querying from.
 * @return {PaginatedRecordResponse} Targered partial response.
 */
ShotgunApiClient.prototype.entityReadAll = async function({ entity, fields, filter, pageSize, pageNumber }) {

	let query = {
		page: {
			size: pageSize || 500,
			number: pageNumber || 1,
		},
	};

	if (Array.isArray(fields))
		fields = fields.join(',');
	if (fields)
		query.fields = fields;

	if (filter) {
		for (let k in filter) {
			query[`filter[${k}]`] = filter[k];
		}
	}

	let respBody = await this.request({
		method: 'GET',
		path: `/entity/${entity}`,
		query,
	});
	respBody._pageSize = pageSize;
	return new PaginatedRecordResponse(respBody);
};
