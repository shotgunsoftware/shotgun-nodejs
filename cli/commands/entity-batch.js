const { getClient, printOutput } = require('./index');

/**
 * Create, update and delete multiple entities in one operation.
 *
 * Expected input is an array of requests as documented at
 * https://developer.shotgunsoftware.com/rest-api/#batching
 *
 * shotgun-nodejs entity-batch '[{"request_type":"create","entity":"Project","data":{"code":"my_new_project","name":"My New Project"}},{"request_type":"update","entity":"Project","record_id":86,"data":{"name":"Some New Project Name"}},{"request_type":"delete","entity":"Project","record_id":86}]'
 */
module.exports = {
	args: '<requests>',
	desc: 'Create, update and delete multiple entities in one operation.',
	builder: (yargs) => {
		return yargs.positional('requests', {
			describe: 'JSON-formatted array of requests.',
			type: 'string',
		});
	},
	handler: async (argv) => {
		let requests = JSON.parse(argv.requests);
		printOutput(await getClient(argv).entityBatch({ requests }));
	}
};
