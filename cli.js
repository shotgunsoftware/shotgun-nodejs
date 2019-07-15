#!node --experimental-modules
import inquirer from 'inquirer';
import chalk from 'chalk';
import url from 'url';
import util from 'util';
import { default as ShotgunClient, RequestError, PaginatedRecordResponse } from './client.js';
import inquirerCheckboxPlusPrompt from 'inquirer-checkbox-plus-prompt';
import fuzzy from 'fuzzy';
import fs from 'fs';
import path from 'path';

inquirer.registerPrompt('checkbox-plus', inquirerCheckboxPlusPrompt);

const Operations = {
	SCAN:   'List entities',
	SELECT: 'View entity',
	CREATE: 'Create entity',
	UPDATE: 'Update entity',
	DELETE: 'Delete entity',
	UPLOAD: 'Upload file',
	// SEARCH: 'Search entity',
};
const defaults = {
	operation: Operations.SCAN,
	entity: 'HumanUser',
};

async function main() {

	let { siteUrl } = await inquirer.prompt({
		name: 'siteUrl',
		message: 'Shotgun site URL:',
		default: process.env.SHOTGUN_SITE,
		type: 'input',
	});

	while (true) {

		let parsedSite = url.parse(siteUrl);
		if (parsedSite.host)
			break;

		let [subdomain, path] = siteUrl.split('/', 2);
		siteUrl = `https://${subdomain}.shotgunstudio.com`;
		if (path) siteUrl += `/${path}`

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
	while (true) {

		let { username, password } = await inquirer.prompt([{
			name: 'username',
			message: 'Username:',
			default: process.env.SHOTGUN_USERNAME,
			type: 'input',
		}, {
			name: 'password',
			message: 'Password:',
			mask: true,
			default: process.env.SHOTGUN_PASSWORD,
			type: 'password',
		}]);

		console.log(`Connecting to ${chalk.green(siteUrl)}...`);
		client = new ShotgunClient({
			siteUrl,
			username,
			password,
			debug: !!process.env.SHOTGUN_DEBUG,
		});

		try {
			await client.connect();
			break;
		} catch (err) {
			console.log(chalk.red(`Error connecting to Shotgun API: ${err.message}`));
			console.log(`Please try again.`);
		}
	}

	while (true) {

		console.log('');

		let out = '';
		try {

			let { operation, entity } = await inquirer.prompt([{
				name: 'operation',
				message: 'Operation:',
				choices: Object.values(Operations),
				type: 'list',
				default: defaults.operation,
			}, {
				name: 'entity',
				message: 'Target entity name:',
				type: 'input',
				default: defaults.entity,
			}]);

			defaults.operation = operation;
			defaults.entity = entity;

			switch (operation) {

				case Operations.SELECT: {
					let { entityId } = await inquirer.prompt([{
						name: 'entityId',
						message: 'Entity id:',
						type: 'number',
						default: defaults.selectEntityId,
					}]);

					out = await client.entityRead({ entity, entityId });
					break;
				}

				case Operations.SCAN: {

					let { allFieldsWanted } = await inquirer.prompt([{
						name: 'allFieldsWanted',
						message: `Show all fields?`,
						type: 'confirm',
						default: true
					}]);

					let fields = '*';
					if (!allFieldsWanted) {

						let schema = await client.schemaGet({ entity });
						let choices = Object.keys(schema).sort().filter(k => k !== 'id');

						let { selectedFields } = await inquirer.prompt([{
							name: 'selectedFields',
							message: `Select fields`,
							type: 'checkbox-plus',
							pageSize: 15,
							highlight: true,
							searchable: true,
							async source(answersSoFar, input) {
								input = input || '';
								let fuzzyResult = fuzzy.filter(input, choices);
								let data = fuzzyResult.map(element => element.original);
								return data;
							}
						}]);

						fields = selectedFields.join(',');
					}

					let { filterWanted } = await inquirer.prompt([{
						name: 'filterWanted',
						message: `Create attribute filter?`,
						type: 'confirm',
						default: false
					}]);

					let filter;
					if (filterWanted) {
						filter = await promptDataObject();
					}

					let { pageSize } = await inquirer.prompt([{
						name: 'pageSize',
						message: 'Page size:',
						type: 'number',
						default: 500,
					}]);

					// Sanity
					if (isNaN(pageSize)) pageSize = 500;

					out = await client.entityReadAll({
						entity,
						fields,
						filter,
						pageSize,
					});
					break;
				}

				case Operations.CREATE: {
					let data = await promptDataObject();
					out = await client.entityCreate({ entity, data });
					break;
				}

				case Operations.UPDATE: {
					let { entityId } = await inquirer.prompt([{
						name: 'entityId',
						message: 'Entity id:',
						type: 'number',
					}]);
					let data = await promptDataObject();
					out = await client.entityUpdate({ entity, entityId, data });
					break;
				}

				case Operations.DELETE: {
					let { entityId } = await inquirer.prompt([{
						name: 'entityId',
						message: 'Entity id:',
						type: 'number',
					}]);

					let entry = await client.entityRead({ entity, entityId });
					console.log(util.inspect(entry, false, Infinity, true));

					let { confirm } = await inquirer.prompt([{
						name: 'confirm',
						message: `Are you sure you want to delete the above entry?`,
						type: 'confirm',
						default: false
					}]);
					if (!confirm)
						continue;

					out = await client.entityDelete({ entity, entityId });
					break;
				}

				case Operations.UPLOAD: {
					let { entityId, fieldName } = await inquirer.prompt([{
						name: 'entityId',
						message: 'Entity id:',
						type: 'number',
					}, {
						name: 'fieldName',
						message: `Target field name (optional):`,
						type: 'input',
					}]);

					let entry = await client.entityRead({ entity, entityId });
					if (fieldName && !entry.attributes[fieldName])
						throw new Error(`Field name ${fieldName} does not exist.`);

					let file, uploadFileBlob;
					while (true) {

						file = (await inquirer.prompt([{
							name: 'file',
							message: 'File path:',
							type: 'input',
						}])).file;

						if (!fs.existsSync(file) || !fs.lstatSync(file).isFile()) {
							console.log(chalk.red('File not found. Please try again.'));
							continue;
						}

						uploadFileBlob = fs.readFileSync(file);
						break;
					}

					let { targetFileName } = await inquirer.prompt([{
						name: 'targetFileName',
						message: 'Target File name:',
						type: 'input',
						default: path.basename(file),
					}]);

					console.log('Uploading file...');

					await client.entityItemUpload({
						entity,
						entityId,
						fieldName,
						targetFileName,
						uploadFileBlob,
					});

					console.log(chalk.green('Done!'));
					break;
				}

				default: {
					console.log(chalk.yellow(`Invalid operation '${chalk.white(operation)}'`))
					continue;
				}
			}

			if (out instanceof PaginatedRecordResponse) {

				while (true) {

					console.log(`${out.getTable()}`);

					if (out.reachedEnd())
						break;

					let { confirm } = await inquirer.prompt({
						name: 'confirm',
						message: `More entries may be available. View more?`,
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

async function promptDataObject() {

	let out = {};
	while (true) {

		let { input } = await inquirer.prompt([{
			name: 'input',
			message: `Input key-value colon-separated pair.\n  Current data: ${chalk.cyan(JSON.stringify(out))}\n${chalk.green('>')}`,
			type: 'input',
		}]);

		if (!input)
			break;

		if (input[0] === '-') {
			delete out[input.substr(1)];
			continue;
		}

		let [ k, v ] = input.split(':', 2);

		k = (k) ? k.trim() : '';
		v = (v) ? v.trim() : null;

		if (typeof v === 'string' && (v.startsWith("'") && v.endsWith("'") || v.startsWith('"') && v.endsWith('"'))) {
			v = v.slice(1, -1);
		} else if (v === 'true') {
			v = true;
		} else if (v === 'false') {
			v = false;
		} else if (!isNaN(v)) {
			v = parseFloat(v);
		}

		out[k] = v;
	};

	return out;
}

(async () => {
	try {
		await main();
	} catch (err) {
		console.error(chalk.red(err.stack));
	}
})();
