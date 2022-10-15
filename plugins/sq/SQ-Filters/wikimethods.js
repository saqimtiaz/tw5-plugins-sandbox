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

