/*\
title: $:/sq/sandbox/modules/filters/shuffle.js
type: application/javascript
module-type: filteroperator
Shuffle the input list
\*/

exports["_shuffle"] = function(source, operator) {
	let results = [];
	source(function (tiddler, title) {
		results.push(title);
	});
	for(let i = results.length -1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[results[i], results[j]] = [results[j], results[i]];
	}
	return results;
};
