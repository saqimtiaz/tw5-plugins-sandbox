/*\
title: $:/core/modules/widgets/eventcatcherplus.js
type: application/javascript
module-type: widget

Event handler widget

\*/

"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var EventWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
EventWidget.prototype = new Widget();

/*
Render this widget into the DOM
*/
EventWidget.prototype.render = function(parent,nextSibling) {
	var self = this;
	// Remember parent
	this.parentDomNode = parent;
	// Compute attributes and execute state
	this.computeAttributes();
	this.execute();
	// Create element
	var tag = this.parseTreeNode.isBlock ? "div" : "span";
	if(this.elementTag && $tw.config.htmlUnsafeElements.indexOf(this.elementTag) === -1) {
		tag = this.elementTag;
	}
	var domNode = this.document.createElement(tag);
	this.domNode = domNode;
	// Assign classes
	this.assignDomNodeClasses();
	// Add our event handlers
	this.toggleListeners();
	// Insert element
	parent.insertBefore(domNode,nextSibling);
	this.renderChildren(domNode,null);
	this.domNodes.push(domNode);
};

/*
Compute the internal state of the widget
*/
EventWidget.prototype.execute = function() {
	var self = this;
	// Get attributes that require a refresh on change
	this.types = [];
	$tw.utils.each(this.attributes,function(value,key) {
		if(key.charAt(0) === "$") {
			self.types.push(key.slice(1));
		}
	});
	this.pointerCaptureMode = this.getAttribute("pointerCapture","no");
	if(!this.types.length) {
		this.types = this.getAttribute("events","").split(" ");
	}
	this.elementTag = this.getAttribute("tag");
	// Make child widgets
	this.makeChildWidgets();
};

/*
Cache and pre-create all event listeners, called when first needed
*/
EventWidget.prototype.cacheEventListeners = function() {
	if(this._eventListeners) {
		return;
	}
	this._eventListeners = Object.create(null);
	this._captureActiveListeners = Object.create(null);
	this._dynamicOnlyEvents = ["pointerup","pointercancel","pointermove"];

	// Dynamic pointer capture listeners
	if(this.pointerCaptureMode === "dynamic") {
		["pointerup","pointercancel"].forEach(type => {
			this._eventListeners[type] = event => {
				const selectedNode = this.checkEvent(event, type);
				if(this._lastPointerId) {  // TODO: make sure its always set in dynamic
					this.stopPointerCapture(event.pointerId);
					this._captureTarget = null;
				}
				// Remove dynamic-only listeners
				this.cleanupDynamicListeners();
				return this.handleEvent(event, type, selectedNode);
			};
		});
		if(!this.types.includes("pointerdown")) {
			this.types.push("pointerdown");
		}
	}

	// Create any listeners not already defined above
	this.types.forEach(type => {
		if(!this._eventListeners[type]) {
			this._eventListeners[type] = event => {
				const selectedNode = this.checkEvent(event, type);

				// Handle pointer capture for pointerdown
				if(selectedNode && type==="pointerdown") {

					if(this.pointerCaptureMode!=="no") {
						this._captureTarget = event.target;
						this.startPointerCapture(event.pointerId);
					}

					if(this.pointerCaptureMode==="dynamic") {
						this._dynamicOnlyEvents.forEach(dt => {
							const listener = this._eventListeners[dt];
							if(listener) {
								this._captureActiveListeners[dt] = listener;
								this.domNode.addEventListener(dt, listener, false);
								//FIXME: do the actions need to happen before we attach the listeners?
									// is it even enough that actions happen first? DOM wont refresh until refresh cycle
							}
						});
					}
				} else if(selectedNode && (type==="pointerup" || type==="pointercancel")) {
					if(this._lastPointerId) {
						this.stopPointerCapture(event.pointerId);
						this._captureTarget = null;
					}
				}

				return this.handleEvent(event, type, selectedNode);
			};
		}
	});
};

/*
Check if an event qualifies and return the matching selected node
*/
EventWidget.prototype.checkEvent = function(event, type) {
	let selectedNode = event.target;

	if(this._captureTarget && event.pointerId !== undefined) {
		// Use captureTarget only if it’s still attached to the DOM
		if(document.contains(this._captureTarget)) {
			selectedNode = this._captureTarget;
		} else {
			// Fallback: clear stale reference
			this._captureTarget = null;
			selectedNode = this.domNode; // or event.target as delivered
		}
	}

	if(selectedNode.nodeType === 3) {
		selectedNode = selectedNode.parentNode;
	}
	const selector = this.getAttribute("selector"),
		matchSelector = this.getAttribute("matchSelector");

	if(matchSelector && !$tw.utils.domMatchesSelector(selectedNode, matchSelector)) {
		return null;
	}
	if(selector) {
		while(!$tw.utils.domMatchesSelector(selectedNode, selector) && selectedNode !== this.domNode) {
			selectedNode = selectedNode.parentNode;
		}
		if(selectedNode === this.domNode) {
			return null;
		}
	}
	return selectedNode;
};

/*
Handle the event and execute actions
*/
EventWidget.prototype.handleEvent = function(event, type, selectedNode) {
	if(!selectedNode) {
		return false;
	}

	let actions = this.getAttribute("$"+type) || this.getAttribute("actions-"+type),
		stopPropagation = this.getAttribute("stopPropagation","onaction"),
		variables = {};

	if(actions) {
		variables = $tw.utils.collectDOMVariables(selectedNode, this.domNode, event);
		variables.modifier = $tw.keyboardManager.getEventModifierKeyDescriptor(event);
		const mouseButtonMap = {0:"left",1:"middle",2:"right"};
		variables["event-mousebutton"] = "button" in event ? mouseButtonMap[event.button] : undefined;
		variables["event-type"] = event.type.toString();
		if(typeof event.detail === "object" && !!event.detail) {
			$tw.utils.each(event.detail,(detailValue,detail) => {
				variables["event-detail-"+detail] = detailValue.toString();
			});
		} else if(!!event.detail) {
			variables["event-detail"] = event.detail.toString();
		}
		this.invokeActionString(actions, this, event, variables);
	}
	if((actions && stopPropagation==="onaction") || stopPropagation==="always") {
		event.preventDefault();
		event.stopPropagation();
		return true;
	}
	return false;
};

EventWidget.prototype.startPointerCapture = function(pointerId) {
	if(!this._lastPointerId && this.domNode && this.domNode.setPointerCapture) {
		this.domNode.setPointerCapture(pointerId);
		this._lastPointerId = pointerId;
	}
};

EventWidget.prototype.stopPointerCapture = function(pointerId) {
	if(this.domNode && this.domNode.hasPointerCapture && this.domNode.hasPointerCapture(pointerId)) {
		this.domNode.releasePointerCapture(pointerId);
		this._lastPointerId = null;
	}
};

/*
Attach all relevant listeners
*/
EventWidget.prototype.attachListeners = function() {
	this.cacheEventListeners();
	const domNode = this.domNode;
	Object.keys(this._eventListeners).forEach(type => {
		if(this.pointerCaptureMode === "dynamic" && this._dynamicOnlyEvents.includes(type)) {
			return; //skip dynamic-only events
		}
		domNode.addEventListener(type, this._eventListeners[type], false);
	});
};

/*
Remove dynamic active listeners
*/
EventWidget.prototype.cleanupDynamicListeners = function() {
	const domNode = this.domNode;
	Object.keys(this._captureActiveListeners || {}).forEach(type => {
		domNode.removeEventListener(type, this._captureActiveListeners[type], false);
	});
	this._captureActiveListeners = Object.create(null);
};

/*
Remove all listeners
*/
EventWidget.prototype.removeAllListeners = function() {
	if(this._lastPointerId) {
		this.stopPointerCapture(this._lastPointerId);
	}
	const domNode = this.domNode;
	Object.keys(this._eventListeners || {}).forEach(type => {
		domNode.removeEventListener(type, this._eventListeners[type], false);
	});
	this.cleanupDynamicListeners();
	this._captureTarget = null;
};

/*
Enable or disable listeners
*/
EventWidget.prototype.toggleListeners = function() {
	let disabled = this.getAttribute("disabled","no") === "yes";
	if(disabled) {
		this.removeAllListeners();
	} else {
		this.attachListeners();
	}
};

/*
Assign DOM node classes
*/
EventWidget.prototype.assignDomNodeClasses = function() {
	var classes = this.getAttribute("class","").split(" ");
	classes.push("tc-eventcatcher");
	this.domNode.className = classes.join(" ");
};

/*
Refresh widget
*/
EventWidget.prototype.refresh = function(changedTiddlers) {
	const changedAttributes = this.computeAttributes(),
		changedKeys = Object.keys(changedAttributes),
		canUpdateAttributes = changedKeys.every(key => key === "class" || key === "disabled");
	if(canUpdateAttributes) {
		if(changedAttributes["class"]) {
			this.assignDomNodeClasses();
		}
		if(changedAttributes["disabled"]) {
			this.toggleListeners();
		}
		return this.refreshChildren(changedTiddlers);
	}
	this.refreshSelf();
	return true;
};

exports.eventcatcherplus = EventWidget;
