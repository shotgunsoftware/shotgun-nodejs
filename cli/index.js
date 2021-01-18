#! /usr/bin/env node
const chalk = require('chalk');
const Yargs = require('yargs');
const { defineCommands } = require('./commands');
const { default: runInteractive } = require('./interactive');

async function main() {

	let yargs = Yargs
		.usage(`
Usage: shotgun-nodejs [command] [params]

Interact with Shotgun API.
If no command is passed, interactive mode will be active.
More information about each command may be retrieved with --help.`)
		.strict(true)
		.wrap(128)
		.help()
		.options({
			site: {
				description: 'Shotgun site URL. Defaults to $SHOTGUN_SITE.',
				alias: 's',
				default: process.env.SHOTGUN_SITE,
			},
			grant_type: {
				description: 'Shotgun access grant type. Defaults to $SHOTGUN_GRANT_TYPE.',
				default: process.env.SHOTGUN_GRANT_TYPE || 'password',
			},
			username: {
				description: 'Shotgun password credentials password. Defaults to $SHOTGUN_USERNAME.',
				alias: 'u',
				default: process.env.SHOTGUN_USERNAME,
			},
			password: {
				description: 'Shotgun password credentials password. Defaults to $SHOTGUN_PASSWORD.',
				alias: 'p',
				default: process.env.SHOTGUN_PASSWORD,
			},
			client_id: {
				description: 'Shotgun client credentials ID. Defaults to $SHOTGUN_CLIENT_ID.',
				default: process.env.SHOTGUN_CLIENT_ID,
			},
			client_secret: {
				description: 'Shotgun client credentials secret. Defaults to $SHOTGUN_CLIENT_SECRET.',
				default: process.env.SHOTGUN_CLIENT_SECRET,
			},
			debug: {
				description: 'Debug mode',
				boolean: true,
				default: !!process.env.SHOTGUN_DEBUG,
			},
		});

	defineCommands(yargs);

	let argv = yargs.argv;

	if (!argv._[0])
		await runInteractive(argv);
}


(async () => {
	try {
		await main();
	} catch (err) {
		console.error(chalk.red(err.stack));
	}
})();
