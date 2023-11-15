const { ShotgunApiClient } = require('../client');
const { PaginatedRecordResponse } = require('../paginated-record-response');

/**
 * Read multiple entities.
 *
 * @param  {string}       options.entity       - Entity type.
 * @param  {Object}       [options.filter]     - Key-value pair object to evaluate exact match filters.
 * @param  {Array|String} [options.fields]     - List of fields to show.
 * @param  {Array|String} [options.sort]       - List of ordering fields.
 * @param  {number}       [options.pageSize]   - Upper limit of items shown on response page.
 * @param  {number}       [options.pageNumber] - Position in list of items to start querying from.
 * @param  {Object}       [options.options]    - Request option settings.
 * @return {PaginatedRecordResponse} Targered partial response.
 */
ShotgunApiClient.prototype.entityReadAll = async function({ entity, filter, fields, sort, pageSize, pageNumber, options }) {

	let query = {
		page: {
			size: pageSize || 500,
			number: pageNumber || 1,
		},
	};

	if (filter) {
		for (let k in filter) {
			query[`filter[${k}]`] = filter[k];
		}
	}

	if (Array.isArray(fields))
		fields = fields.join(',');
	if (fields)
		query.fields = fields;

	if (Array.isArray(sort))
		sort = sort.join(',');
	if (sort)
		query.sort = sort;

	if (options) {
		query.options = options;
	}

	let respBody = await this.request({
		method: 'GET',
		path: `/entity/${entity}`,
		query,
	});
	respBody._pageSize = pageSize;
	return new PaginatedRecordResponse(respBody);
};
