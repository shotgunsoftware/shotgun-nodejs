import chalk from 'chalk';
import util from 'util';
import { default as ShotgunClient, RequestError, PaginatedRecordResponse } from '../client.js';
import { parseColonKeyValue } from '../helper.js';

export default function defineCommands(yargs) {

	yargs.command({
		command: 'entity-read <entity> <entityId>',
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
	});

	yargs.command({
		command: 'entity-read-all <entity> [params..]',
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
	});

	yargs.command({
		command: 'entity-create <entity> [data..]',
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
	});
}

function getClient({ site, username, password, debug }) {

	if (!site || !username || !password) {
		console.error(chalk.red(`Shotgun site or credentials are not defined. Please use --help for usage instructions`));
		process.exit(1);
	}

	return new ShotgunClient({
		siteUrl: site,
		username,
		password,
		debug,
	});
}

async function printOutput(out, forceJsonOutput) {

	if (!forceJsonOutput && out instanceof PaginatedRecordResponse) {
		console.log(`${out.getTable()}`);
	} else {
		console.log(util.inspect(JSON.parse(JSON.stringify(out)), false, Infinity, true));
	}
}
