/*\
title: $:/plugins/sq/sq-filters/filters/_images-wikfied.js
module-type: filteroperator
description: Filter operator to wikify the tiddler specified in the input titles and return the source attributes of all images found. //Only for use inside action strings// NB! Very hacky! Requires wikimethods.js from this plugin.
\*/
(function(){
getImagesWikified = function(title,selector,exclude,options) {
	let wiki = options.wiki,
		wikifyText = wiki.getTiddlerText(title),
		wikifyWidgetNode,
		wikifyContainer,
		wikifyParser,
		images = [],
		html,
		htmlParser;
	// Create the parse tree
	wikifyParser = wiki.parseText("html",wikifyText,{
			parseAsInline: false
		});
	// Create the widget tree 
	wikifyWidgetNode = wiki.makeWidget(wikifyParser,{
			document: $tw.fakeDocument,
			parentWidget: options.widget
		});
	// Render the widget tree to the container
	wikifyContainer = $tw.fakeDocument.createElement("div");
	wikifyWidgetNode.render(wikifyContainer,null);
	htmlParser = options.wiki.parseText("text/vnd.tiddlywiki",wikifyContainer.innerHTML);
	return options.wiki.extractImages(htmlParser.tree);
};


exports["_images-wikified"] = function(source,operator,options) {
	let results = new $tw.utils.LinkedList(),
		selector = operator.operands[0],
		exclude = operator.prefix === "!";
	source(function(tiddler,title) {
		results.pushTop(getImagesWikified(title,selector,exclude,options));
	});
	return results.makeTiddlerIterator(options.wiki);
};
})();
