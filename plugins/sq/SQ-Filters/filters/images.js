/*\
title: $:/plugins/sq/sq-filters/filters/_images.js
module-type: filteroperator
description: Filter operator to find the images directly used in a tiddler with the `[img[src]]` or `<$image>` syntax, or using the `all` suffix to wikify and extract all images. Requires `wikimethods.js` from this plugin.
\*/

exports["_images"] = function(source,operator,options) {
	var results = new $tw.utils.LinkedList(),
		suffix = operator.suffix || "",
		getImagesFn = suffix === "all" ? options.wiki.getTiddlerImagesWikified : options.wiki.getTiddlerImages;
	source(function(tiddler,title) {
		results.pushTop(getImagesFn.call(options.wiki,title,options));
	});
	return results.makeTiddlerIterator(options.wiki);	
};

