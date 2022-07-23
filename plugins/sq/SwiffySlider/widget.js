/*\
title: $:/plugins/sq/swiffy-slider/widget.js
type: application/javascript
module-type: widget

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";
exports.platforms = ["browser"];
if(!$tw.sq) {
	$tw.sq = {};
}

var Widget = require("$:/core/modules/widgets/widget.js").widget;


var SwiffySliderWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
SwiffySliderWidget.prototype = new Widget();

/*
Render this widget into the DOM
*/
SwiffySliderWidget.prototype.render = function(parent,nextSibling) {
	this.parentDomNode = parent;
	this.computeAttributes();
	this.execute();
	
	this.domNode = this.document.createElement("div");
	this.domNode.className = "swiffy-slider-wrapper";
	parent.insertBefore(this.domNode,nextSibling);
	this.renderChildren(this.domNode,null);
	this.domNodes.push(this.domNode);

	var Swiffy = require("$:/plugins/sq/swiffy-slider/swiffy-slider.umd.js").swiffyslider;
	Swiffy.extensions = require("$:/plugins/sq/swiffy-slider/swiffy-slider-extensions.umd.js").swiffysliderextensions;
	var sliderDOMNode = this.domNode.querySelector(".swiffy-slider");
	if(sliderDOMNode) {
		Swiffy.initSlider(this.domNode.querySelector(".swiffy-slider"));
		Swiffy.extensions.initSlider(this.domNode.querySelector(".swiffy-slider"));
	}
};


SwiffySliderWidget.prototype.execute = function() {
	this.makeChildWidgets();
};

SwiffySliderWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	if($tw.utils.count(changedAttributes)>0) {
		this.refreshSelf();
		return true;
	} else {
		var retValue = this.refreshChildren(changedTiddlers);
		/*
		if(retValue) {
			reinit swiffy, or force a refreshSelf?
		} 
		*/
		return retValue;
	}
};

exports["swiffy-slider"] = SwiffySliderWidget;

})();