const { ShotgunApiClient } = require('../client');
const { PaginatedRecordResponse } = require('../paginated-record-response');

/**
 * Query entities with complex filters.
 * Consult documentation for propoer syntax
 * https://developer.shotgunsoftware.com/rest-api/#searching
 *
 * @param  {string}   options.entity       - Entity type.
 * @param  {Object}   options.filters      - Filter input (array or hash format).
 * @param  {Object}   [options.fields]     - List of fields to show.
 * @param  {string[]} [options.sort]       - List of fields used as sort order.
 * @param  {number}   [options.pageSize]   - Upper limit of items shown on response page.
 * @param  {number}   [options.pageNumber] - Position in list of items to start querying from.
 * @return {PaginatedRecordResponse} Query results.
 */
ShotgunApiClient.prototype.entitySearch = async function({ entity, filters, fields, sort, pageSize, pageNumber }) {

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

	if (Array.isArray(sort))
		query.sort = sort.join(',');

	let contentType = Array.isArray(filters) ? 'array' : 'hash';

	let body = { filters };

	let respBody = await this.request({
		method: 'POST',
		path: `/entity/${entity}/_search`,
		headers: {
			'Content-Type': `application/vnd+shotgun.api3_${contentType}+json`
		},
		query,
		body,
	});
	respBody._pageSize = pageSize;
	return new PaginatedRecordResponse(respBody);
};
