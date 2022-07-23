/*\
title: $:/plugins/sq/links-context-menu/link.js
type: application/javascript
module-type: widget-subclass
Link widget override for renderLink method
\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.baseClass = "link"; //

//exports.name = "link";

exports.constructor = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

exports.prototype = {};

exports.prototype.renderLink = function(parent,nextSibling) {
	Object.getPrototypeOf(Object.getPrototypeOf(this)).renderLink.call(this,parent,nextSibling);
	
	var link = this.domNodes[0];
	var self = this;
	if($tw.utils.hasClass(link,"tc-tiddlylink-resolves") || $tw.utils.hasClass(link,"tc-tiddlylink")) {
		link.addEventListener("contextmenu",function(event) {
			if(event.ctrlKey) { //todo make this key configurable
				return false;
			}
			event.preventDefault();
			
			var rect = link.getBoundingClientRect();
			
			$tw.popup.triggerPopup({
				//domNode: link,
				domNodeRect: {
					"left": rect.left + window.scrollX,
					"top": rect.top + window.scrollY,
					width: link.offsetWidth,
					height: link.offsetHeight
				},
				title: "$:/state/sq/links-context-menu/",
				wiki: self.wiki,
				noStateReference: true
			});
			self.wiki.setText("$:/state/sq/links-context-menu/","current",undefined,self.to);
			
		});
	}
	
}


})();


////render a reveal widget alongside each link. 