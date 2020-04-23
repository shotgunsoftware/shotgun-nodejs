const fetch = require('node-fetch');
const fileType = require('file-type');
const util = require('util');

const { ErrorResponse, RequestError } = require('./error');
const { SchemaFieldDefinition } = require('./schema-field-definition');
const { PaginatedRecordResponse } = require('./paginated-record-response');

const REFRESH_EXPIRATION_WINDOW = 1000 * 60 * 3;
const DEFAULT_API_BASE_PATH = '/api/v1';

class ShotgunApiClient {

	constructor({ siteUrl, credentials, debug, apiBasePath = DEFAULT_API_BASE_PATH }) {

		this.siteUrl = siteUrl;
		this.credentials = credentials;
		this._token = null;
		this.tokenExpirationTimestamp = null;
		this.debug = debug;

		if (apiBasePath && !apiBasePath.startsWith('/'))
			apiBasePath = '/' + apiBasePath;

		this.apiBasePath = apiBasePath;
	}

	get token() {
		return this._token;
	}

	set token(val) {
		this._token = val;
		this.tokenExpirationTimestamp = val.expires_in * 1000 + Date.now();
	}

	async connect(credentials = this.credentials) {

		let { siteUrl, apiBasePath } = this;

		let url = new URL(`${siteUrl}${apiBasePath}/auth/access_token`);
		// @NOTE Should they be cleared from memory at this time?
		url.search = new URLSearchParams(credentials);

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
			throw new Error(`Error parsing connect response: ${err.message}`);
		}

		if (!resp.ok) {

			let errorResp = new ErrorResponse(body);
			throw new Error(`Error getting connect response: ${errorResp}`);
		}

		this.token = body;
		return body;
	}

	async refreshToken() {

		let { siteUrl, apiBasePath, token } = this;

		if (!token)
			return await this.connect();

		let url = new URL(`${siteUrl}${apiBasePath}/auth/access_token`);
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
			throw new Error(`Error parsing refresh token response: ${err.message}`);
		}

		if (!resp.ok) {
			let errorResp = new ErrorResponse(body);
			throw new Error(`Error getting refresh token response: ${errorResp}`);
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

	async request({ method = 'GET', path, headers, body }) {

		let { siteUrl, apiBasePath, debug } = this;

		if (!path)
			path = '/';

		if (!path.startsWith('/'))
			path = '/' + path;

		if (apiBasePath)
			path = `${apiBasePath}${path}`;

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
			let reason = await uploadResp.text();
			throw new Error(`Error uploading file: ${reason}`);
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

	async schemaGet({ entity, fieldName, projectId }) {

		let path = '/schema';
		if (entity) {
			path += `/${entity}`;
			if (fieldName) {
				path += '/fields';
				if (typeof fieldName === 'string') {
					path += `/${fieldName}`;
				}
			}
		}

		let body = {};
		if (projectId)
			body.project_id = projectId;

		let respBody = await this.request({
			method: 'GET',
			path,
			body,
		});
		return respBody.data;
	}

	async schemaFieldCreate({ entity, schemaFieldDefinition }) {

		if (!(schemaFieldDefinition instanceof SchemaFieldDefinition))
			schemaFieldDefinition = new SchemaFieldDefinition(schemaFieldDefinition);

		let body = schemaFieldDefinition.toBody();

		let respBody = await this.request({
			method: 'POST',
			path: `/schema/${entity}/fields`,
			body,
		});
		return respBody.data;
	}

	async schemaFieldUpdate({ entity, fieldName, schemaFieldDefinition, projectId }) {

		if (!(schemaFieldDefinition instanceof SchemaFieldDefinition))
			schemaFieldDefinition = new SchemaFieldDefinition(schemaFieldDefinition);

		let body = schemaFieldDefinition.toBody();

		if (projectId)
			body.project_id = projectId;

		let respBody = await this.request({
			method: 'PUT',
			path: `/schema/${entity}/fields/${fieldName}`,
			body,
		});
		return respBody.data;
	}

	async schemaFieldDelete({ entity, fieldName }) {

		let respBody = await this.request({
			method: 'DELETE',
			path: `/schema/${entity}/fields/${fieldName}`,
		});
		return respBody;
	}

	async schemaFieldRevive({ entity, fieldName }) {

		let respBody = await this.request({
			method: 'POST',
			path: `/schema/${entity}/fields/${fieldName}?revive=true`,
		});
		return respBody;
	}

	async preferencesGet({ names } = {}) {

		if (!Array.isArray(names)) names = [names];
		names = names.filter(Boolean);

		let path = '/preferences';

		let prefs = names.join(',');
		if (prefs) path += '?' + (new URLSearchParams({ prefs })).toString();

		let respBody = await this.request({
			method: 'GET',
			path
		});
		return respBody.data;
	}
}

module.exports = {
	default: ShotgunApiClient,
	ShotgunApiClient,
};
