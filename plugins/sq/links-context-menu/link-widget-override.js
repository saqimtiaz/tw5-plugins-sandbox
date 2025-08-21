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
			let root = event.currentTarget,
				rootRect = root.getBoundingClientRect();
			self.wiki.setText("$:/state/sq/links-context-menu/","current",undefined,self.to);
			self.wiki.setText("$:/state/sq/links-context-menu/","pageX",undefined,event.pageX);
			self.wiki.setText("$:/state/sq/links-context-menu/","pageY",undefined,event.pageY);
			self.wiki.setText("$:/state/sq/links-context-menu/","clientX",undefined,event.clientX);
			self.wiki.setText("$:/state/sq/links-context-menu/","clientY",undefined,event.clientY);
			self.wiki.setText("$:/state/sq/links-context-menu/","rootTop",undefined,rootRect.top);
			self.wiki.setText("$:/state/sq/links-context-menu/","rootLeft",undefined,rootRect.left);
			self.wiki.setText("$:/state/sq/links-context-menu/","rootHeight",undefined,rootRect.height);
			self.wiki.setText("$:/state/sq/links-context-menu/","rootWidth",undefined,rootRect.width);
			self.wiki.setText("$:/state/sq/links-context-menu/","rootBottom",undefined,rootRect.bottom);
			self.wiki.setText("$:/state/sq/links-context-menu/","rootRight",undefined,rootRect.right);

			
			//TODO: set pageX and pageY as fields, then as variables in template
			//IDEA: all popups to have a reference to their state? to get coords?
		});
	}
	
}


})();


////render a reveal widget alongside each link. 