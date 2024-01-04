/*\
title: $:/plugins/sq/ExternalContent/filters/jsonfiltertiddlers.js
type: application/javascript
module-type: filteroperator
description: Interpret each incoming title as a JSON array of tiddlers and return tiddlers that match the filter expression

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Export our filter function
*/
exports["jsonfiltertiddlers"] = function(source,operator,options) {
	var results = [];
	source(function(tiddler,title) {
		let data = $tw.utils.parseJSONSafe(title),
			output = [];
		if(data && Array.isArray(data)) {
			let tempWiki = new $tw.Wiki();
			tempWiki.addTiddlers(data);
			let outputTitles = tempWiki.filterTiddlers(operator.operand||"");
			outputTitles.forEach(title => {
				let tiddler = tempWiki.getTiddler(title);
				if(tiddler) {
					let fields = tiddler.getFieldStrings();;
					output.push(fields)
				}
			});
		}
		results.push(JSON.stringify(output));
	});
	return results;
};

})();
