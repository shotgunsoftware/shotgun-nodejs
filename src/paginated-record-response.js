class PaginatedRecordResponse {

	constructor({ data, links, _pageSize }) {
		this.data = data;
		this.links = links || {};
		this.pageSize = _pageSize;
	}

	reachedEnd() {
		return this.data.length !== this.pageSize;
	}

	async getNext({ client }) {

		let path = this.links.next;
		return this._get({ path, client });
	}

	async getPrev({ client }) {

		let path = this.links.prev;
		return this._get({ path, client });
	}

	async _get({ path, client }) {

		if (!path)
			return;

		let out = new this.constructor(await client.request({
			path,
			skipBasePathPrepend: true
		}));

		// Inherit page size
		out.pageSize = this.pageSize;

		if (!out.data.length)
			return;

		return out;
	}
}

module.exports = {
	default: PaginatedRecordResponse,
	PaginatedRecordResponse,
};
