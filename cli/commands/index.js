const chalk = require('chalk');
const requireAll = require('require-all');
const util = require('util');

const { default: ShotgunClient } = require('../../src/client');
const { default: PaginatedRecordResponse } = require('../../src/paginated-record-response');

function defineCommands(yargs) {

	const definitions = requireAll({
		dirname: __dirname,
	});

	for (let k in definitions) {

		if (k === 'index') continue;

		let definition = definitions[k];
		definition.command = k;
		if (definition.args) {
			definition.command += ` ${definition.args}`;
			delete definition.args;
		}
		yargs.command(definition);
	}
}

function getClient({ site, username, password, debug }) {

	if (!site || !username || !password) {
		console.error(chalk.red('Shotgun site or credentials are not defined. Please use --help for usage instructions'));
		process.exit(1);
	}

	return new ShotgunClient({
		siteUrl: site,
		credentials: {
			grant_type: 'password',
			username,
			password,
		},
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

module.exports = {
	default: defineCommands,
	defineCommands,
	getClient,
	printOutput,
};
