/*\

title: $:/plugins/sq/essentials/action-transmit.js
type: application/javascript
module-type: widget

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget,
	PropagateWidget = require("$:/plugins/sq/essentials/propagate.js").propagate;

var TransmitWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
TransmitWidget.prototype = new Widget();

/*
Render this widget into the DOM
*/
TransmitWidget.prototype.render = function(parent,nextSibling) {
	this.computeAttributes();
	this.execute();
	this.parentDomNode = parent;
	this.renderChildren(parent,nextSibling);
};

/*
Compute the internal state of the widget
*/
TransmitWidget.prototype.execute = function() {
	this.actions = this.getAttribute("actions");
	this.target = this.getAttribute("target");
	this.makeChildWidgets();
};

/*
Refresh the widget by ensuring our attributes are up to date
*/
TransmitWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	if($tw.utils.count(changedAttributes) > 0) {
		this.refreshSelf();
		return true;
	}
	return this.refreshChildren(changedTiddlers);
};


TransmitWidget.prototype.searchChildren = function(widget) {
	var target,
		self = this;
	for(const child of widget.children) {
		if(child instanceof PropagateWidget && child.getAttribute("name") === this.target) {
			target = child;
			break;
		} else {
			target = self.searchChildren(child);
			if(!!target) {
				break;
			}
		}
	}
	return target;
};

/*
Invoke the action associated with this widget
*/
TransmitWidget.prototype.invokeAction = function(triggeringWidget,event) {
	var target = this.searchChildren(triggeringWidget);
	if(target) {
		target.propagate(this.actions);
	}
	return true;
};

exports["action-transmit"] = TransmitWidget;

})();