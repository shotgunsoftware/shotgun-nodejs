const inquirer = require('inquirer');
const fuzzy = require('fuzzy');
const { promptEntityName, promptDataObject } = require('../prompts');

async function run({ client, defaults }) {

	let entity = await promptEntityName(defaults);
	let { allFieldsWanted } = await inquirer.prompt([{
		name: 'allFieldsWanted',
		message: 'Show all fields?',
		type: 'confirm',
		default: true
	}]);

	let fields = '*';
	if (!allFieldsWanted) {
		let fieldsSchema = await client.schemaGet({ entity, fields: true });
		let choices = Object.keys(fieldsSchema).sort().filter(k => k !== 'id');

		let { selectedFields } = await inquirer.prompt([{
			name: 'selectedFields',
			message: 'Select fields',
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
		message: 'Create attribute filter?',
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

	return await client.entityReadAll({
		entity,
		fields,
		filter,
		pageSize,
	});
}

const title = 'List entity records';
const priority = 1;

module.exports = {
	default: run,
	run,
	title,
	priority,
};
