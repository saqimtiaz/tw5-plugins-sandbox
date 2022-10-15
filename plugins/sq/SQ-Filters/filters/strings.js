/*\
title: $:/plugins/sq/sq-filters/filters/strings.js
type: application/javascript
module-type: filteroperator
Filter operators for strings.
\*/


/* 
	NaN operands are treated as 0
	Missing first operand is treated as 0
	Missing second operand returns the string from the start index until the end
	
	Keep all characters from the 10th onwards:
		[<input>_snip[10]
	Keep the first 10 characters only:
		[<input>_snip[0],[10]]
	Keep the 11th-20th characters:
		[<input>_snip[10],[20]]
	Keep the last 10 characters:
		[<input>_snip[-10]]
	Use String.slice under the covers.
	https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/slice
*/
exports["_snip"] = function(source,operator,options) {
	var result = [],
		start = $tw.utils.parseInt(operator.operands[0]),
		count,
		end;	
	if(operator.operands[1]) {
		count = $tw.utils.parseInt(operator.operands[1]);
		end = start + count;
		if(start < 0 && end >= 0) {
			end = undefined;
		}
	}
	source(function(tiddler,title) {
		result.push(title.slice(start,end));
	});
	return result;
};


/*
names:
select
selectList
snipList
*/

/*
https://github.com/Jermolene/TiddlyWiki5/issues/5824#issuecomment-962585264
## Revised proposal 3 for slice[] and cut[] operators, avoiding the use of negative numbers.

This revision makes the two new operators slice[] and cut[] more consistent with each other. They now accept the same number of operands, and the suffixes mean the exact same thing in both. slice[] retains the specified number of characters from the start or the end depending on the suffix, cut[] removes them. 

All of the above use cases can be accommodated by using the two operators together and I think ultimately this will be more user friendly than the previous proposals.

_consider this a draft until I ping for feedback_

**Slice operator**
- Alternative names: retain
- Specifies what part of the string should be kept (rather than removed)
  - _operand 1_: number of characters to keep or remove, from beginning or end of string depending on the suffix
- `[<input>slice:start|end[length]]`

Examples:
- Keep the first 10 characters only:
  - `[<input>slice:start[10]]`
- Keep the last 40 characters:
  - `[<input>slice:end[40]]`
- Keep the 11th-20th characters:
  - `[<input>cut:start[10]slice:start[10]]`
- Of the last 40 characters, keep the first 5.
  - `[<input>slice:end[40]slice:start[5]]`

---
  
**Cut operator**
- Alternative names: chop, excise, resect
- Specifies what part of a string should be removed, from beginning or end of string depending on the suffix
- `[<input>cut:start|end[length]]`

Examples:
- Remove first 10 characters from the beginning of the string:
  - `[<input>cut:start[10]]`
- Remove last 10 characters:
  - `[<input>cut:end[10]]`



*/
