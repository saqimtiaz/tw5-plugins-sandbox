/*\
title: $:/plugins/sq/editor-autolist/editor-operation-autolist.js
type: application/javascript
module-type: texteditoroperation
Text editor operation to automate syntax for lists
\*/
(function(){


function getListLevelInfoForLine(state,index,lineContent) {
	if(index && !state.allLines[index]) {
		return null;
	}
	const listPrefixRegex = /^((\*|#)+)(.*)$/;
	const match = (index!= null ? state.allLines[index] : lineContent).match(listPrefixRegex);
	return match && match[1] ? {listPrefix: match[1], level: match[1].length, listType: match[2], content: match[3]} : null;
}

exports["autolist"] = function(event,operation) {
	
	let state = Object.create(null),
		mode = event.paramObject? event.paramObject.mode : undefined,
		listPrefixRegex = /^(?:(?:\*|#)+).*/
	
	if(mode === "newline") {
		let firstLineStart = $tw.utils.findPrecedingLineBreak(operation.text,operation.selStart),
			firstLineEnd = $tw.utils.findFollowingLineBreak(operation.text,operation.selStart),
			firstLine = operation.text.substring(firstLineStart,firstLineEnd),
			emptyListItemRegex = /^((\*|#)+)$/;

		if(listPrefixRegex.test(firstLine)) {
			// we are on a list line
			if(emptyListItemRegex.test(firstLine.trimEnd())){
				// we have an empty list line with no content so terminate the list
				operation.replacement = "\n";
				operation.cutStart = firstLineStart;
				operation.cutEnd = operation.selEnd;
				operation.newSelStart = firstLineStart + 1;
				operation.newSelEnd = operation.newSelStart;
			} else {
				//list line with content, continue list on next line
				let listItemInfo = getListLevelInfoForLine(state,null,firstLine);
				if(operation.selStart === firstLineStart && operation.selStart === operation.selEnd) {
					//cursor is at the beginning of the line, add a new list item before this one at the same level and prefix
					operation.replacement = `${listItemInfo.listPrefix} \n`;
					operation.newSelStart = operation.selStart = operation.selStart + listItemInfo.listPrefix.length + 1;
					operation.newSelEnd = operation.newSelStart;
				} else {
					operation.replacement = `\n${listItemInfo.listPrefix} `;
					operation.newSelStart = operation.selStart + listItemInfo.listPrefix.length + 2;
					operation.newSelEnd = operation.newSelStart;				
				}
				operation.cutStart = operation.selStart;
				operation.cutEnd = operation.selEnd;
				// check for trailing whitespace after selEnd that we want to remove
				if(!operation.text.substring(operation.selEnd,firstLineEnd).trim().length) {
					operation.cutEnd = firstLineEnd;
				}

			}
		} else {
			// selection does not start on a list line, so we need to manually add a linebreak for lines not starting with list markup
			operation.replacement = "\n";
			operation.cutStart = operation.selStart;
			operation.cutEnd = operation.selEnd;
			operation.newSelStart = operation.selStart + 1;
			operation.newSelEnd = operation.newSelStart;
		}
	} else if(mode === "indent" || mode === "unindent") {
		state.startSelectedLines = $tw.utils.findPrecedingLineBreak(operation.text,operation.selStart);
		// if there is a selection move the marker back by one to make sure we don't include a trailing line break
		let endMarker = (operation.selStart !== operation.selEnd) ? operation.selEnd - 1 : operation.selEnd;
		state.endSelectedLines = $tw.utils.findFollowingLineBreak(operation.text,endMarker);
		state.selectedText = operation.text.substring(state.startSelectedLines,state.endSelectedLines);		
		state.selectedLines = state.selectedText.split("\n");
		state.selectedLinesCount = state.selectedLines.length;
		state.allLines = operation.text.split("\n");
		state.allLinesCount = state.allLines.length;
		state.prefixText = operation.text.substring(0,state.startSelectedLines-1);
		state.suffixText = operation.text.substring(state.endSelectedLines+1);
		state.prefixLinesCount = state.prefixText.length ? state.prefixText.split("\n").length : 0;
		state.suffixLinesCount = state.suffixText.length ? state.suffixText.split("\n").length : 0;
		state.selectedLinesInfo = state.selectedLines.map((line,index,selLines) => {
			return getListLevelInfoForLine(state,index + state.prefixLinesCount);
		});
		//non list items will have null value for info in selectedLinesInfo
		state.modifiedLines = Array(state.selectedLines.length).fill("");
		if(mode === "indent"){
			let prevListItemInfo,
				listItemInfo,
				prevNewListType;
			state.selectedLines.forEach(function(element,index,array) {
				/// exclude lines that dont start with a list prefix, they will have listItemInfo as null
				listItemInfo = listItemInfo || getListLevelInfoForLine(state,index + state.prefixLinesCount); // use from selectedLinesInfo XXX
				if(!listItemInfo) {
					// not a list item so put the original text in modifiedLines
					state.modifiedLines[index] = element;
					return;
				}
				let	newlistType,
					nextListItemInfo;
				//better if we were changing the new levels and prefixes for selected lines somewhere and I could check against that
				if(prevListItemInfo && prevListItemInfo.level === listItemInfo.level && prevListItemInfo.listPrefix === listItemInfo.listPrefix) {
					newlistType = prevNewListType;
				} else {
					prevListItemInfo = prevListItemInfo || getListLevelInfoForLine(state, index -1 + state.prefixLinesCount);
					if(prevListItemInfo && prevListItemInfo.level >= listItemInfo.level + 1) {
						newlistType = prevListItemInfo.listPrefix[listItemInfo.level];
					} else {
						nextListItemInfo = getListLevelInfoForLine(state,index + 1 + state.prefixLinesCount);
						if(nextListItemInfo && nextListItemInfo.level >= listItemInfo.level + 1) {
							newlistType = nextListItemInfo.listPrefix[listItemInfo.level];
						} else if(nextListItemInfo) {
							// as long as there is a next list item in the SELECTION that is the same level and prefix, keep going further
							let selIndex = index + 1,
								nextInfo = state.selectedLinesInfo[selIndex];
							while(nextInfo && nextInfo.level === listItemInfo.level && nextInfo.listType === listItemInfo.listType) {
								selIndex++;
								nextInfo = state.selectedLinesInfo[selIndex];
							}
							nextInfo = getListLevelInfoForLine(state,selIndex + state.prefixLinesCount);
							if(nextInfo && nextInfo.level >= listItemInfo.level + 1) {
								newlistType = nextInfo.listPrefix[listItemInfo.level];
							}
						}
					}				
				}
				if(!newlistType) {
					newlistType = listItemInfo.listType;
				}
				state.modifiedLines[index] = `${listItemInfo.listPrefix}${newlistType}${listItemInfo.content}`;
				//console.log(`${listItemInfo.content} => ${newlistType} | `,state.modifiedLines[index]);
				prevListItemInfo = listItemInfo;
				listItemInfo = nextListItemInfo;
				prevNewListType = newlistType;
			},this);			
		} else if(mode === "unindent") {
			state.selectedLines.forEach(function(element,index,array) {
				let listItemInfo = state.selectedLinesInfo[index];
				if(listItemInfo) {
					//remove the last character of the listPrefix if its a list item
					state.modifiedLines[index] = `${listItemInfo.listPrefix.slice(0,-1)}${listItemInfo.content}`;
				} else {
					// if its not a list item then use the original text
					state.modifiedLines[index] = element;
				}
			});
		}
		let replacement = state.modifiedLines.join("\n");
		if(replacement) {
			operation.replacement = state.modifiedLines.join("\n");
			operation.cutStart = state.startSelectedLines;
			operation.cutEnd = state.endSelectedLines;
			operation.newSelStart = state.startSelectedLines;
			operation.newSelEnd = state.startSelectedLines + operation.replacement.length;		
		}
	} 
};

})();
