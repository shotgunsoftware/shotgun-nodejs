function parseColonKeyValue(input) {

	let [ key, value ] = input.split(':', 2);

	key = (key) ? key.trim() : '';
	value = (value) ? value.trim() : null;

	if (typeof value === 'string' && (value.startsWith('\'') && value.endsWith('\'') || value.startsWith('"') && value.endsWith('"'))) {
		value = value.slice(1, -1);
	} else if (value === 'true') {
		value = true;
	} else if (value === 'false') {
		value = false;
	} else if (!isNaN(value)) {
		value = parseFloat(value);
	}

	return { key, value };
}

module.exports = {
	parseColonKeyValue,
};
