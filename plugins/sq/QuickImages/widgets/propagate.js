/*\

title: $:/plugins/sq/essentials/propagate.js
type: application/javascript
module-type: widget

\*/
(function(){

	/*jslint node: true, browser: true */
	/*global $tw: false */
	"use strict";
	
	var Widget = require("$:/core/modules/widgets/widget.js").widget;
	
	var PropagateWidget = function(parseTreeNode,options) {
		this.initialise(parseTreeNode,options);
	};
	
	/*
	Inherit from the base widget class
	*/
	PropagateWidget.prototype = new Widget();
	
	/*
	Render this widget into the DOM
	*/
	PropagateWidget.prototype.render = function(parent,nextSibling) {
		this.computeAttributes();
		this.execute();
		this.parentDomNode = parent;
		this.renderChildren(parent,nextSibling);
	};
	
	/*
	Compute the internal state of the widget
	*/
	PropagateWidget.prototype.execute = function() {
		this.preactions = this.getAttribute("preactions","");
		this.postactions = this.getAttribute("postactions","");
		this.name = this.getAttribute("name");
		this.makeChildWidgets();
	};

	PropagateWidget.prototype.propagate = function(actionString) {
		actionString = this.preactions + actionString + this.postactions;
		this.invokeActionString(actionString);
	}
	
	/*
	Refresh the widget by ensuring our attributes are up to date
	*/
	PropagateWidget.prototype.refresh = function(changedTiddlers) {
		var changedAttributes = this.computeAttributes();
		if($tw.utils.count(changedAttributes) > 0) {
			this.refreshSelf();
			return true;
		}
		return this.refreshChildren(changedTiddlers);
	};
	
	exports["propagate"] = PropagateWidget;
	
	})();