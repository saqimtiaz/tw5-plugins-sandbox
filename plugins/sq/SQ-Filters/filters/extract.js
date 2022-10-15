/*\
title: $:/plugins/sq/sq-filters/filters/_extract.js
type: application/javascript
module-type: filteroperator
description: Extracts a portion of the list of input titles around a given marker. `_extract[marker],[beforeCount],[afterCount]`

* Given a title as operand[0], return operand[1] items before the marker, the marker, and operand[2] items after the marker
* missing or negative operands in position 1 and 2 are treated as 0
* if the value for operands 1 or 2 are out of range, the maximum number of items possible are returned
* no output with no operands provided
* keyword `all` used in operands 1 or 2 will return all items before and after the marker respectively.
\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Export our filter function
*/
exports["_extract"] = function(source,operator,options) {
	const clamp = (num, min, max) => Math.min(Math.max(num, min), max);
	let results = [],
		marker = operator.operands[0],
		index;
	source(function (tiddler, title) {
		results.push(title);
	});	
	index = results.indexOf(marker);
	let beforeCount = (operator.operands[1] && operator.operands[1] === "all") ? index : Math.max($tw.utils.parseInt(operator.operands[1] || 0),0),
		afterCount = (operator.operands[2] && operator.operands[2] === "all") ? results.length - index : Math.max($tw.utils.parseInt(operator.operands[2] || 0),0);
	if(index > -1) {
		return results.slice(clamp(index - beforeCount,0,index), clamp(index + 1 + afterCount,index + 1,results.length));
	} else {
		return [];
	}
};

})();
