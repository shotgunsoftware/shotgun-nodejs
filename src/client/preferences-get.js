const { ShotgunApiClient } = require('../client');

/**
 * Fetch preferences.
 *
 * @param  {string} options.names - List of preference names.
 * @return {Object} Hash table of preferences.
 */
ShotgunApiClient.prototype.preferencesGet = async function({ names }) {

	if (!Array.isArray(names)) names = [names];
	names = names.filter(Boolean).join(',');

	let query = {
		prefs: names
	};

	let respBody = await this.request({
		method: 'GET',
		path: '/preferences',
		query,
	});
	return respBody.data;
};
