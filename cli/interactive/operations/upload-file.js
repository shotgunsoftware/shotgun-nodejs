const chalk = require('chalk');
const fs = require('fs');
const inquirer = require('inquirer');
const path = require('path');
const { promptEntityName } = require('../prompts');

async function run({ client, defaults }) {

	let entity = await promptEntityName(defaults);
	let { entityId, fieldName } = await inquirer.prompt([{
		name: 'entityId',
		message: 'Entity id:',
		type: 'number',
	}, {
		name: 'fieldName',
		message: 'Target field name (optional):',
		type: 'input',
	}]);

	let entry = await client.entityRead({ entity, entityId });
	if (fieldName && !entry.attributes[fieldName])
		throw new Error(`Field name ${fieldName} does not exist.`);

	let file, uploadFileBlob;
	// eslint-disable-next-line no-constant-condition
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
}

const title = 'Upload file';
const priority = 100;

module.exports = {
	default: run,
	run,
	title,
	priority,
};
