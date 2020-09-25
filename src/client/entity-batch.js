const { ShotgunApiClient } = require('../client');

/**
 * Batch entity CRUD requests
 *
 * @param  {Object} options.requests - List of requests to batch.
 * @return {Object[]} Mapped request results.
 */
ShotgunApiClient.prototype.entityBatch = async function({ requests }) {

	let body = {
		requests
	};

	let respBody = await this.request({
		method: 'POST',
		path: '/entity/_batch/',
		body,
	});
	return respBody.data;
};
