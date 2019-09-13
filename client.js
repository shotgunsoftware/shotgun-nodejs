const fetch = require('node-fetch');
const fileType = require('file-type');
const fs = require('fs');
const path = require('path');
const Table = require('cli-table3');
const util = require('util');

const REFRESH_EXPIRATION_WINDOW = 1000 * 60 * 3;

class ShotgunApiClient {

	constructor({ siteUrl, username, password, debug }) {

		this.siteUrl = siteUrl;
		this.username = username;
		this.password = password;
		this._token = null;
		this.tokenExpirationTimestamp = null;
		this.debug = debug;
	}

	get token() {
		return this._token;
	}

	set token(val) {
		this._token = val;
		this.tokenExpirationTimestamp = val.expires_in * 1000 + Date.now();
	}

	async connect() {

		var url = new URL(`${this.siteUrl}/api/v1/auth/access_token`);
		url.search = new URLSearchParams({
			username: this.username,
			password: this.password,
			grant_type: 'password',
		});

		let resp = await fetch(url, {
			method: 'POST',
			headers: {
				'Accept': 'application/json',
			}
		});

		let body;
		try {
			body = await resp.json();
		} catch (err) {
			throw new Error(`Error parsing connect response: ${err.message}`)
		}

		if (!resp.ok) {

			let errorResp = new ErrorResponse(body);
			throw new Error(`Error getting connect response: ${errorResp}`)
		}

		this.token = body;
		return body;
	}

	async refreshToken() {

		let { siteUrl, token } = this;

		if (!token)
			return await connect();

		var url = new URL(`${this.siteUrl}/api/v1/auth/access_token`);
		url.search = new URLSearchParams({
			refresh_token: token.refresh_token,
			grant_type: 'refresh',
		});

		let resp = await fetch(url, {
			method: 'POST',
			headers: {
				'Accept': 'application/json',
				'Content-Type': 'application/x-www-form-urlencoded',
			}
		});

		let body;
		try {
			body = await resp.json();
		} catch (err) {
			throw new Error(`Error parsing refresh token response: ${err.message}`)
		}

		if (!resp.ok) {
			let errorResp = new ErrorResponse(body);
			throw new Error(`Error getting refresh token response: ${errorResp}`)
		}

		this.token = body;
		return body;
	}

	async getAuthorizationHeader() {

		let { token, tokenExpirationTimestamp } = this;

		if (!token)
			token = await this.connect();
		else if (Date.now() + REFRESH_EXPIRATION_WINDOW > tokenExpirationTimestamp)
			token = await this.refreshToken();

		return `${token.token_type} ${token.access_token}`;
	}

	async request({ method = 'GET', path, headers, body, skipApiPathPrepend }) {

		let { siteUrl, debug } = this;

		if (!path)
			path = '/';

		if (!path.startsWith('/'))
			path = '/' + path;

		if (!skipApiPathPrepend)
			path = `/api/v1${path}`;

		if (!headers)
			headers = {};

		let inHeaders = headers;
		headers = Object.assign({
			'Accept': 'application/json',
			'Content-Type': 'application/json',
			'Authorization': await this.getAuthorizationHeader(),
		}, inHeaders);

		let url = new URL(path, siteUrl);
		if (body) {
			if (method === 'GET' || method === 'HEAD') {
				url.search = new URLSearchParams(body);
				body = undefined;
			} else {
				body = JSON.stringify(body);
			}
		}

		let requestId = Math.random().toString(36).substr(2);
		if (debug)
			console.log('Sending request', requestId, url.href, util.inspect({ method, headers, body }, false, Infinity, true));

		let resp = await fetch(url, { method, headers, body });

		let respBody;
		try {
			respBody = await resp.json();
		} catch (err) {
			// Do nothing
		}

		if (debug)
			console.log('Response received', requestId, util.inspect(respBody, false, Infinity, true));

		if (!resp.ok)
			throw new RequestError({ method, path, respBody, resp });

		return respBody;
	}

	async entityReadAll({ entity, fields, filter, pageSize, pageNumber }) {

		let body = {
			'page[size]': pageSize || 500,
			'page[number]': pageNumber || 1,
		};

		if (fields)
			body.fields = fields;

		if (filter) {
			for (let k in filter) {
				body[`filter[${k}]`] = filter[k];
			}
		}

		let respBody = await this.request({
			method: 'GET',
			path: `/entity/${entity}`,
			body,
		});
		respBody._pageSize = pageSize;
		return new PaginatedRecordResponse(respBody);
	}

	async entityRead({ entity, entityId }) {
		let respBody = await this.request({
			method: 'GET',
			path: `/entity/${entity}/${entityId}`,
		});
		return respBody.data;
	}

	async entityCreate({ entity, data }) {
		let respBody = await this.request({
			method: 'POST',
			path: `/entity/${entity}`,
			body: data
		});
		return respBody.data;
	}

	async entityUpdate({ entity, entityId, data }) {
		let respBody = await this.request({
			method: 'PUT',
			path: `/entity/${entity}/${entityId}`,
			body: data
		});
		return respBody.data;
	}

	async entityDelete({ entity, entityId }) {
		let respBody = await this.request({
			method: 'DELETE',
			path: `/entity/${entity}/${entityId}`,
		});
		return respBody;
	}

	async entitySearch({ entity, filters, fields }) {
		let respBody = await this.request({
			method: 'POST',
			path: `/entity/${entity}/_search`,
			body: { filters, fields },
			headers: {
				'Content-Type': 'application/vnd+shotgun.api3_array+json'
			},
		});
		return respBody.data;
	}

	// @TODO Support stream
	async entityItemUpload({ entity, entityId, fieldName, targetFileName, uploadFileBlob, additionalUploadData = {} }) {

		let path = `/entity/${entity}/${entityId}`;
		if (fieldName) path += `/${fieldName}`;
		path += '/_upload';

		// Get upload link
		let uploadMetadata = await this.request({
			method: 'GET',
			path,
			body: { filename: targetFileName },
		});

		// Sanity: NodeJS Buffer to Blob
		if (uploadFileBlob instanceof Buffer) {
			uploadFileBlob.type = fileType(uploadFileBlob).mime;
			uploadFileBlob.size = uploadFileBlob.length;
		}

		// If upload link is not AWS, then API makes guess on the host.
		// Wrong in test and private environments. Apply correction if needed.
		let uploadUrl = new URL(uploadMetadata.links.upload);
		let siteUrl = new URL(this.siteUrl);
		if (uploadUrl.hostname === siteUrl.hostname) {
			uploadUrl.protocol = siteUrl.protocol;
			uploadUrl.port = siteUrl.port;
		}

		if (this.debug) {
			console.log('PUT file', uploadUrl.href, uploadFileBlob.type, uploadFileBlob.size);
		}

		// Upload file
		let uploadResp = await fetch(uploadUrl, {
			method: 'PUT',
			headers: {
				'Content-Type': uploadFileBlob.type,
				'Content-Size': uploadFileBlob.size
			},
			body: uploadFileBlob,
		});

		if (!uploadResp.ok) {
			let reason = await resp.text();
			throw new Error(`Error uploading file: ${reason}`)
		}

		// Complete loop by persisting metadata
		await this.request({
			method: 'POST',
			path: uploadMetadata.links.complete_upload,
			body: {
				'upload_info': uploadMetadata.data,
				'upload_data': additionalUploadData
			},
			skipApiPathPrepend: true,
		});
	}

	async schemaGet({ entity }) {
		let respBody = await this.request({
			method: 'GET',
			path:  `/schema/${entity}/fields`,
		});
		return respBody.data;
	}
}

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
			skipApiPathPrepend: true
		}));

		// Inherit page size
		out.pageSize = this.pageSize;

		if (!out.data.length)
			return;

		return out;
	}

	getTable() {

		let { data } = this;

		let head = ['id'];
		head = head.concat(Object.keys(data[0].attributes) || []);
		head = head.concat(Object.keys(data[0].relationships) || []);

		let table = new Table({ head });
		for (let row of data) {
			let values = [row.id];
			values = values.concat(Object.values(row.attributes) || []);

			let relationshipValues = Object.values(row.relationships) || [];
			relationshipValues = relationshipValues.map(v => {
				let { data } = v
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

class ErrorResponse {
	constructor({ errors } = {}) {
		if (!errors) errors = [];
		this.errors = errors.map(err => new ErrorObject(err));
	}

	toString() {
		return this.errors.map(err => `${err.title} (Code ${err.code})`).join('; ');
	}
}

class ErrorObject {
	constructor({ id, status, code, title, detail, source, meta } = {}) {
		this.id = id;
		this.status = status;
		this.code = code;
		this.title = title;
		this.detail = detail;
		this.source = source;
		this.meta = meta;
	}
}

class RequestError extends Error {

	constructor({ message, method, path, respBody, resp }) {

		if (!message) {
			message = 'Error performing request';
			if (method) message += ' ' + method;
			if (path) message += ' ' + path;
			if (respBody) message += ': ' + JSON.stringify(respBody);
		}
		super(message);

		this.body = respBody;
		this.resp = resp;
	}
}

module.exports = {
	default: ShotgunApiClient,
	ShotgunApiClient,
	PaginatedRecordResponse,
	RequestError,
}
