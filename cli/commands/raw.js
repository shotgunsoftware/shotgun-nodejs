const util = require('util');
const { getClient, printOutput } = require('./index');
const { RequestError } = require('../../src/error');

module.exports = {
	args: '<method> <path> [body]',
	desc: 'Raw Request.',
	builder: (yargs) => {
		return yargs.positional('method', {
			describe: 'HTTP method',
			type: 'string',
		}).positional('path', {
			describe: 'Path to query',
			type: 'string',
		}).positional('body', {
			describe: 'JSON-formatted body. Make sure to enclose the object in a string quote.',
			type: 'string',
		});
	},
	handler: async ({ method, path, body, ...argv }) => {

		// Formatting
		method = method.toUpperCase();

		if (body) {
			try {
				body = JSON.parse(body);
			} catch (err) {
				throw new Error(`Invalid JSON body: ${err.message}`);
			}
		}

		try {
			printOutput(await getClient(argv).request({
				method,
				path,
				body
			}));

		} catch (err) {

			if (err instanceof RequestError) {
				console.error(err.simpleMessage, util.inspect(err.body, false, Infinity, true));
			} else {
				console.error(err.message);
			}
		}
	}
};
