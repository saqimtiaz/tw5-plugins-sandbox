/*\
title: $:/plugins/sq/OneTabGuard/iframe.js
type: application/javascript
module-type: widget
\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var IframeWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
IframeWidget.prototype = new Widget();

/*
Render this widget into the DOM
*/
IframeWidget.prototype.render = function(parent,nextSibling) {
	var self = this,
		domNode;
	// Remember parent
	this.parentDomNode = parent;
	// Compute attributes and execute state
	this.computeAttributes();
	this.execute();
	// Create element
	if(this.buttonTag && $tw.config.htmlUnsafeElements.indexOf(this.buttonTag) === -1) {
		tag = this.buttonTag;
	}
	domNode = this.document.createElement("iframe");
	domNode.onload = function() {
		function getDocHeight(doc) {
			doc = doc || document;
			// stackoverflow.com/questions/1145850/
			var body = doc.body, html = doc.documentElement;
			var height = Math.max( body.scrollHeight, body.offsetHeight, 
				html.clientHeight, html.scrollHeight, html.offsetHeight );
			return height;
		}
		
		function setIframeHeight(id) {
			var ifrm = domNode;
			var doc = ifrm.contentDocument? ifrm.contentDocument: 
				ifrm.contentWindow.document;
			ifrm.style.visibility = 'hidden';
			ifrm.style.height = "10px"; // reset to minimal height ...
			// IE opt. for bing/msn needs a bit added or scrollbar appears
			ifrm.style.height = getDocHeight( doc ) + 4 + "px";
			ifrm.style.visibility = 'visible';
		}
		setIframeHeight();
	};
	this.domNode = domNode;
	this.assignAttributes(domNode,{excludeEventAttributes: true});
	// Insert element
	parent.insertBefore(domNode,nextSibling);
	domNode.setAttribute("src",this.src);
	this.renderChildren(domNode,null);
	this.domNodes.push(domNode);
};

/*
Compute the internal state of the widget
*/
IframeWidget.prototype.execute = function() {
	// Get attributes
	this.src = this.getAttribute("src");
	this.style = this.getAttribute("style")
	// Make child widgets
	this.makeChildWidgets();
};



exports.iframe = IframeWidget;

})();
