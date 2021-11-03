const Table = require('cli-table3');

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

	// TODO: Strip out to CLI
	getTable() {

		let { data } = this;

		let head = ['id'];
		head = head.concat(data[0] && Object.keys(data[0].attributes) || []);
		head = head.concat(data[0] && Object.keys(data[0].relationships) || []);

		let table = new Table({ head });
		for (let row of data) {
			let values = [row.id];
			values = values.concat(Object.values(row.attributes) || []);

			let relationshipValues = Object.values(row.relationships) || [];
			relationshipValues = relationshipValues.map(v => {
				let { data } = v;
				if (!data) return;
				if (!Array.isArray(data)) return data.id;
				return data.map(data2 => {
					return (typeof data2 !== 'object' || !data2)
						? data2
						: data2.id;
				}).join(', ');
			});
			values = values.concat(relationshipValues);

			table.push(values);
		}

		return table.toString();
	}
}

module.exports = {
	default: PaginatedRecordResponse,
	PaginatedRecordResponse,
};
