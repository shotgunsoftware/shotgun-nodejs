const chalk = require('chalk');
const inquirer = require('inquirer');
const inquirerCheckboxPlusPrompt = require('inquirer-checkbox-plus-prompt');
const requireAll = require('require-all');
const url = require('url');
const util = require('util');

const { default: ShotgunClient } = require('../../src/client');
const { RequestError } = require('../../src/error');
const { PaginatedRecordResponse } = require('../../src/paginated-record-response');

inquirer.registerPrompt('checkbox-plus', inquirerCheckboxPlusPrompt);

const operations = requireAll({ dirname: `${__dirname}/operations` });
const operationNameKeyMap = Object.keys(operations).reduce(function(acc, k) {
	let v = operations[k];
	let title = v.title || k;
	acc[title] = k;
	return acc;
}, {});
const operationNames = Object.keys(operationNameKeyMap).sort((a, b) => {
	let priorityA = operations[operationNameKeyMap[a]].priority || 0;
	let priorityB = operations[operationNameKeyMap[b]].priority || 0;
	return priorityA - priorityB;
});

const defaults = {
	entity: 'HumanUser',
};

async function run(argv) {

	let { siteUrl } = await inquirer.prompt({
		name: 'siteUrl',
		message: 'Shotgun site URL:',
		default: argv.site,
		type: 'input',
	});

	// eslint-disable-next-line no-constant-condition
	while (true) {

		let parsedSite = url.parse(siteUrl);
		if (parsedSite.host)
			break;

		let [subdomain, path] = siteUrl.split('/', 2);
		siteUrl = `https://${subdomain}.shotgunstudio.com`;
		if (path) siteUrl += `/${path}`;

		let { confirm } = await inquirer.prompt({
			name: 'confirm',
			message: `Did you mean ${chalk.green(siteUrl)}?`,
			type: 'confirm',
		});

		if (confirm) break;

		({ siteUrl } = await inquirer.prompt({
			name: 'siteUrl',
			message: 'Please enter a valid shotgun site URL:',
			type: 'input',
		}));

		parsedSite = url.parse(siteUrl);
	}

	let client;
	// eslint-disable-next-line no-constant-condition
	while (true) {

		let { username, password } = await inquirer.prompt([{
			name: 'username',
			message: 'Username:',
			default: argv.username,
			type: 'input',
		}, {
			name: 'password',
			message: 'Password:',
			mask: true,
			default: argv.password,
			type: 'password',
		}]);

		console.log(`Connecting to ${chalk.green(siteUrl)}...`);
		client = new ShotgunClient({
			siteUrl,
			credentials: {
				username,
				password,
				grant_type: 'password',
			},
			debug: argv.debug,
		});

		try {
			await client.connect();
			break;
		} catch (err) {
			console.log(chalk.red(`Error connecting to Shotgun API: ${err.message}`));
			console.log('Please try again.');
		}
	}

	// eslint-disable-next-line no-constant-condition
	while (true) {

		console.log('');

		let out = '';
		try {

			let { operationName } = await inquirer.prompt([{
				name: 'operationName',
				message: 'Operation:',
				choices: operationNames,
				type: 'list',
				default: defaults.operationName,
			}]);

			// eslint-disable-next-line require-atomic-updates
			defaults.operationName = operationName;

			let operation = operations[operationNameKeyMap[operationName]];
			out = await operation.run({ client, defaults });

			if (out instanceof PaginatedRecordResponse) {

				// eslint-disable-next-line no-constant-condition
				while (true) {

					console.log(`${out.getTable()}`);

					if (out.reachedEnd())
						break;

					let { confirm } = await inquirer.prompt({
						name: 'confirm',
						message: 'More entries may be available. View more?',
						type: 'confirm',
					});
					if (!confirm)
						break;

					out = await out.getNext({ client });
					if (!out) {
						console.log('Reached end of query.');
						break;
					}
				}
			} else if (out) {
				console.log(util.inspect(out, false, Infinity, true));
			}


		} catch (err) {

			if (err instanceof RequestError) {
				switch (err.resp.status) {
				case 404:
					console.log(chalk.red('Not found.'));
					continue;
				}
			}

			console.error(chalk.red(err.stack));
		}
	}
}


module.exports = {
	default: run,
	run,
};
