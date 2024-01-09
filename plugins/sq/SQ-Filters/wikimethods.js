/*\
title: $:/plugins/sq/sq-filters/wikimethods.js
module-type: wikimethod
\*/

exports.getTiddlerImages = function(title) {
	var self = this;
	return this.getCacheForTiddler(title,"images",function(){
		var parser = self.parseTiddler(title);
		if(parser) {
			return self.extractImages(parser.tree);
		}
		return [];
	});
};

exports.getTiddlerImagesWikified = function(title,options) {
	var self = this;
	return this.getCacheForTiddler(title,"imageswikified",function(){
		var parser = self.wikifyParseTiddler(title,options);
		if(parser) {
			return self.extractImages(parser.tree);
		}
		return [];
	});

};

exports.wikifyParseTiddler = function(title,options) {
	let wiki = options.wiki,
		wikifyText = wiki.getTiddlerText(title),
		wikifyWidgetNode,
		wikifyContainer,
		wikifyParser,
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
	return htmlParser;
};

exports.extractImages = function(parseTreeRoot) {
	var images = [];
	function checkParseTree(parseTree) {
		for(var t=0; t<parseTree.length; t++) {
			var parseTreeNode = parseTree[t],
				value;
			if(parseTreeNode.type === "image" && parseTreeNode.attributes.source && parseTreeNode.attributes.source.type === "string") {
				value = parseTreeNode.attributes.source.value;
			} else if(parseTreeNode.type === "element" && parseTreeNode.tag === "img") {
				if(parseTreeNode.attributes.src && parseTreeNode.attributes.src.type === "string") {
					value = parseTreeNode.attributes.src.value;
				}
			}
			if(!!value && !images.includes(value)) {
				images.push(value);
			}
			if(parseTreeNode.children) {
				checkParseTree(parseTreeNode.children);
			}
		}
	}
	checkParseTree(parseTreeRoot);
	return images;
};

