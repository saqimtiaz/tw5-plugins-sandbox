/*\
title: $:/plugins/sq/selective-refresh/widget.js
type: application/javascript
module-type: widget

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var RefreshWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
RefreshWidget.prototype = new Widget();

/*
Render this widget into the DOM
*/
RefreshWidget.prototype.render = function(parent,nextSibling) {
	this.parentDomNode = parent;
	this.computeAttributes();
	this.execute();
	this.renderChildren(parent,nextSibling);
};

/*
Compute the internal state of the widget
*/
RefreshWidget.prototype.execute = function() {
	// Get our parameters
	this.filter = this.getAttribute("filter");
	this.enabled = this.getAttribute("enabled","yes") !== "no";
	// Construct the child widgets
	this.makeChildWidgets();
};

/*
Selectively refreshes the widget and its children if needed
Always returns true and avoids refreshing children if no filter is provided
If a filter is provided then children are refreshed only if there is a matching changed tiddler
*/
RefreshWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	this.enabled = this.getAttribute("enabled","yes") !== "no";
	if(changedAttributes["filter"]) {
		this.refreshSelf();
		return true;
	} else {
		if(!this.enabled) {
			return this.refreshChildren(changedTiddlers);
		}
		if(this.filter) {
			var filteredChanges,
				changedTiddlerTitles = [];
			$tw.utils.each(changedTiddlers,function(change,title){
				changedTiddlerTitles.push(title);
			});
			filteredChanges = this.wiki.filterTiddlers(this.filter,null,this.wiki.makeTiddlerIterator(changedTiddlerTitles));
			if(filteredChanges.length > 0) {
				return this.refreshChildren(changedTiddlers);				
			}
		}
		return true;
	}
};

exports.refresh = RefreshWidget;

})();