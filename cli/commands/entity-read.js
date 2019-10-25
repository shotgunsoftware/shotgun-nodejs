const { getClient, printOutput } = require('./index');

module.exports = {
	args: '<entity> <entityId>',
	desc: 'Read entity.',
	builder: (yargs) => {
		return yargs.positional('entity', {
			describe: 'Entity type',
			type: 'string',
		}).positional('entityId', {
			describe: 'Target entity ID',
			type: 'number',
		});
	},
	handler: async (argv) => {
		printOutput(await getClient(argv).entityRead(argv));
	}
};
