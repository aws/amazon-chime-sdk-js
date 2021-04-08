
const getTransformedURL = (url, key, value) => {
	let appendOption = '?';
	if (url && url.indexOf('?') !== -1) {
		appendOption = '&'
	}
	return url + appendOption + key + '=' + value;
}

export { getTransformedURL };