/*\
title: $:/plugins/sq/sq-filters/filterrunprefix/then.js
type: application/javascript
module-type: filterrunprefix
description: Does nothing if there are no input titles. Receives no input but provides the titles from the previous run as a stringified title list in the variable `__input`. Allows logic of the form if(X-Filter) :then(Y-Filter)

{{{ [tag[TableOfContents]] :then[enlist<__input>] }}}
\*/
(function(){

	/*jslint node: true, browser: true */
	/*global $tw: false */
	"use strict";
	
	/*
	Export our filter prefix function
	*/
	exports.then = function(operationSubFunction) {
		return function(results,source,widget) {
			if(results.length !== 0) {
				// Only run if previous run(s) produced results
				var thisRunResult = operationSubFunction(source,{
					getVariable: function(name) {
						switch(name) {
							case "__input":
								return "" + __input;
							case "__count":
								return "" + __count;
							default:
								return widget.getVariable(name);
						}
					}
				});
				if(thisRunResult.length !== 0) {
					// Replace results only if this run actually produces a result
					results.clear();
					results.pushTop(thisRunResult);
				}
			}
		};
	};
	
	})();