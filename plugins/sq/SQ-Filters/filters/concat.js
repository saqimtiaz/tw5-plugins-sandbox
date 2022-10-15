/*\
title: $:/plugins/sq/sq-filters/filters/_concat.js
type: application/javascript
module-type: filteroperator
description: Combine all input titles into a string in title list format. Analagous to `format:titlelist[]join[]`

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Export our filter function
*/
exports["_concat"] = function(source,operator,options) {
	var results = [];
	source(function(tiddler,title) {
		if(title && title.length) {
			results.push($tw.utils.stringifyList([title]));
		}
	});
	return [results.join(" ")];
};

})();