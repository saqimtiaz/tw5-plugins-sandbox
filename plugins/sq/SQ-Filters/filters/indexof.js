/*\
title: $:/plugins/sq/sq-filters/filters/_indexof.js
type: application/javascript
module-type: filteroperator
description: return 0 based index of operand in the input titles. Returns no result if the operand is not found in the input titles.

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Export our filter function
*/
exports["_indexof"] = function(source,operator,options) {
	var results = [],
		marker = operator.operands[0],
		index = -1;
	if(!marker) {
		return results;
	}
	source(function(tiddler,title) {
		index++;
		if(title && title.length && title === marker) {
			results.push("" + index);
		}
	});
	return results;
};

})();