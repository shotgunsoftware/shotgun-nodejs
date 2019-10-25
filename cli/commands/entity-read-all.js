const { getClient, printOutput } = require('./index');
const { parseColonKeyValue } = require('../helper');

module.exports = {
	args: '<entity> [params..]',
	desc: 'Read all entities.',
	builder: (yargs) => {
		return yargs.options({
			json: {
				description: 'Display output as JSON',
				boolean: true,
			},
		}).positional('entity', {
			describe: 'Entity type',
			type: 'string',
		}).positional('params', {
			describe: 'The rest of the optional parameters (JSON or colon key-value pairs)'
		});
	},
	handler: async (argv) => {

		let { entity } = argv;
		let params = {};
		for (let input of argv.params) {
			let colonKeyValue = parseColonKeyValue(input);
			params[colonKeyValue.key] = colonKeyValue.value;
		}
		Object.assign(params, { entity });
		printOutput(await getClient(argv).entityReadAll(params), argv.json);
	}
};
