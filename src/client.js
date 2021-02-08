const fetch = require('node-fetch');
const qs = require('qs');
const requireAll = require('require-all');
const util = require('util');

const { RequestError } = require('./error');

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
		url.search = qs.stringify(credentials);

		let resp = await fetch(url, {
			method: 'POST',
			headers: {
				'Accept': 'application/json',
			}
		});

		if (!resp.ok) {

			let respBody = await resp.text();
			let errorResp = new RequestError({ respBody });
			throw new Error(`Error getting connect response: ${errorResp}`);
		}

		let body;
		try {
			body = await resp.json();
		} catch (err) {
			throw new Error(`Error parsing connect response: ${err.message}`);
		}

		this.token = body;
		return body;
	}

	async refreshToken() {

		let { siteUrl, apiBasePath, token } = this;

		if (!token)
			return await this.connect();

		let url = new URL(`${siteUrl}${apiBasePath}/auth/access_token`);
		url.search = qs.stringify({
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

		if (!resp.ok) {

			let respBody = await resp.text();
			let errorResp = new RequestError({ respBody });
			throw new Error(`Error getting refresh token response: ${errorResp}`);
		}

		let body;
		try {
			body = await resp.json();
		} catch (err) {
			throw new Error(`Error parsing refresh token response: ${err.message}`);
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

	async requestRaw({ method = 'GET', path, headers, query, body, requestId, skipBasePathPrepend }) {

		let { siteUrl, apiBasePath, debug } = this;

		if (!path)
			path = '/';

		if (!path.startsWith('/'))
			path = '/' + path;

		if (apiBasePath && !skipBasePathPrepend)
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
		if (query)
			url.search = qs.stringify(query);

		if (body)
			body = JSON.stringify(body);

		if (debug)
			console.log('Sending request', requestId, url.href, util.inspect({ method, headers, body }, false, Infinity, true));

		let resp = await fetch(url, { method, headers, body });
		return resp;
	}

	async request(params) {

		let { debug } = this;
		let { method, path } = params;

		let requestId = Math.random().toString(36).substr(2);
		let resp = await this.requestRaw({ ...params, requestId });

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
}

module.exports = {
	default: ShotgunApiClient,
	ShotgunApiClient,
};

// Apply mixins
requireAll({ dirname: `${__dirname}/client` });
