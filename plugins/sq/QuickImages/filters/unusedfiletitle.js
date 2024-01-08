/*\
title: $:/plugins/sq/quickimages/filters/unusedfiletitle.js
type: application/javascript
module-type: filteroperator

Filter operator for generating unique tiddler titles, while respecting file extensions.

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Export our filter function
*/
exports.unusedfiletitle = function(source,operator,options) {
	var results = [],
		separator = operator.operand || "";
	source(function(tiddler,title) {
		if(title) {
			var value = generateUnusedTitle(title,separator,options);
			if(value) {
				results.push(value);
			}
		}
	});
	return results;
};

function generateUnusedTitle(baseTitle,separator,options) {
	options = options || {};
	var c = 0,
		wiki = options.wiki,
		filename = baseTitle.substring(0,baseTitle.lastIndexOf(".")),
		extension = baseTitle.substring(baseTitle.lastIndexOf(".")),
		title = baseTitle;
	while(wiki.tiddlerExists(title) || wiki.isShadowTiddler(title) || wiki.findDraft(title)) {
		title = filename + separator + (++c) + extension; 
	}
	return title;
}

})();