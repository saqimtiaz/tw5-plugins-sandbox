/*\
title: $:/plugins/sq/sq-filters/filters/_printf.js
type: application/javascript
module-type: filteroperator
description: Substitute variables and operands into strings, a friendler way of constructing strings from components.

<$vars name=Saq age=140>
<$text text={{{ [[My name is $(name)$ and $0$ my age is $(age)$.]printf[I think]] }}}/>
</$vars>

<$text text={{{ [[My name is $0$ and my age is $1$.]printf[Saq],[100]] }}}/>

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
Export our filter function
*/
exports["_printf"] = function(source,operator,options) {
	var results = [];	
	function substitute(str) {		
		var output = str.replace(/\$\((\w+)\)\$/g, function(match,varname) {
			return options.widget.getVariable(varname,{defaultValue: ""})
		});
		output = output.replace(/\$(\d)\$/g, function(match,operandIndex) {
			if(operator.operands[operandIndex]) {
				return operator.operands[operandIndex];
			} else {
				return "$" + operandIndex + "$";
			}
		});
		return(output);
	}
	
	source(function(tiddler,title) {
		if(title) {
			results.push(substitute(title));
		}
	});
	return results;
};

})();