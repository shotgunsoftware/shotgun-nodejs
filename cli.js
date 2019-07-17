#!node --experimental-modules
import chalk from 'chalk';
import Yargs from 'yargs';
import defineCommands from './cli/commands.js';
import { default as runInteractive } from './cli/interactive.js';

async function main() {

	let yargs = Yargs
		.usage(`
usage: shotgun-nodejs [command] [params]

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
			username: {
				description: 'Shotgun credentials password. Defaults to $SHOTGUN_USERNAME.',
				alias: 'u',
				default: process.env.SHOTGUN_USERNAME,
			},
			password: {
				description: 'Shotgun credentials password. Defaults to $SHOTGUN_PASSWORD.',
				alias: 'p',
				default: process.env.SHOTGUN_PASSWORD,
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
