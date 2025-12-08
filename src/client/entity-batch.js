/**
 * Batch entity CRUD requests
 *
 * @param  {Object} options.requests - List of requests to batch.
 * @return {Object[]} Mapped request results.
 */
const entityBatch = async function({ requests }) {

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

module.exports = entityBatch;