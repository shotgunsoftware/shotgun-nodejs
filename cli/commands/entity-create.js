const { getClient, printOutput } = require('./index');
const { parseColonKeyValue } = require('../helper');

module.exports = {
	args: '<entity> [data..]',
	desc: 'Create new entity.',
	builder: (yargs) => {
		return yargs.positional('entity', {
			describe: 'Entity type',
			type: 'string',
		}).positional('data', {
			describe: 'Data to initialize entity with (JSON or colon key-value pairs)'
		});
	},
	handler: async (argv) => {

		let { entity } = argv;
		let data = {};
		for (let input of argv.data) {
			let colonKeyValue = parseColonKeyValue(input);
			data[colonKeyValue.key] = colonKeyValue.value;
		}

		printOutput(await getClient(argv).entityCreate({
			entity,
			data
		}));
	}
};
