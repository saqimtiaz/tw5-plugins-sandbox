/*\
title: $:/plugins/sq/sq-filters/filters/_images.js
module-type: filteroperator
description: Filter operator to find the images directly used in a tiddler with the `[img[src]]` or `<$image>` syntax. Requires wikimethods.js from this plugin.
\*/

exports["_images"] = function(source,operator,options) {
	var results = new $tw.utils.LinkedList();
	source(function(tiddler,title) {
		results.pushTop(options.wiki.getTiddlerImages(title));
	});
	return results.makeTiddlerIterator(options.wiki);	
};

