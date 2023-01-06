/*\
title: $:/plugins/sq/webdav-utils/getUploadPath.js
type: application/javascript
module-type: library

Evaluate a cascade of filters to get an upload path for a tiddler
If option.unique is true, the path generated is a unique canonical_uri in the tiddler, by means of incrementing the file name

\*/
(function(){


/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

/*
getUploadPath("myimage.jpg","uploadPathConfig",{
	"defaultUploadPath": "files",
	"wiki": $tw.wiki,
	"unique" : true //dont allow two tidders to have same canonical_uri, increment the filename
}); // => 'files/morefiles/myimage.jpg'
*/
function getUploadPath(title,configTiddler,options) {
	var pathFilters,
		uploadPath,
		source = options.wiki.makeTiddlerIterator([title]),
		result = options.wiki.filterTiddlers(`[all[]] :cascade[{${configTiddler}}split[\n]!prefix[\\]]`,null,source);
	if(result.length) {
		uploadPath = result[0];
	}
	if(!uploadPath) {
		return null;
	}
	var ext = "",
		filename = uploadPath.substring(0,uploadPath.lastIndexOf("."));
	if(!filename.length) {
		filename = uploadPath;
		var tiddlerType = (options.wiki.getTiddler(title)).fields.type;
		if(tiddlerType && $tw.config.contentTypeInfo[tiddlerType]) {
			ext = $tw.config.contentTypeInfo[tiddlerType].extension;
		}
	} else {
		ext = `.${uploadPath.split(".").pop()}`;
	}
	
	if(options.unique) {
		var matches,
			count = 1;
		while(!!(matches = options.wiki.filterTiddlers(`[_canonical_uri[${filename}${ext}]]`)) && matches.length) {
			if((matches.length === 1) && (matches[0] === title)) {
				break;
			}
			filename = `${filename}_${count}`;
			count++;			
		}
	}
	
	return `${filename}${ext}`;
};

exports.getUploadPath = getUploadPath;
	
})();
