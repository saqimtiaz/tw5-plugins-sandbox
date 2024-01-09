/*\
title: $:/plugins/sq/sq-filters/filters/_images.js
module-type: filteroperator
description: Filter operator to find the images directly used in a tiddler with the `[img[src]]` or `<$image>` syntax, or using the `all` suffix to wikify and extract all images. Requires `wikimethods.js` from this plugin.
\*/

exports["_images"] = function(source,operator,options) {
	var results = new $tw.utils.LinkedList(),
		suffixes = operator.suffixes || [],
		wikify = suffixes[0] ? (suffixes[0][0] || "") : "",
		mode = suffixes[1] ? (suffixes[1][0] || "include") : "include",
		classes = operator.operand,
		getImagesFn = wikify === "all" ? options.wiki.getTiddlerImagesWikified : options.wiki.getTiddlerImages;
	source(function(tiddler,title) {
		results.pushTop(getImagesFn.call(options.wiki,title,{widget: options.widget, classes: classes, mode: mode}));
	});
	return results.makeTiddlerIterator(options.wiki);	
};
