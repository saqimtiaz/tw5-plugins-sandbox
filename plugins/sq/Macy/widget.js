/*\
title: $:/plugins/sq/macy/widget.js
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

/*
 * by rpemberton: https://gist.github.com/rpemberton/b15a206f453ff233830f3183e4ac371a
*/
function debounce(fn) {
  let raf;

  return (...args) => {
	if (raf) {
	  //console.log('debounced');
	  return;
	}

	raf = window.requestAnimationFrame(() => {
	  fn(...args); // run useful code
	  raf = undefined;
	});
  };
}

/*
 * prefix: the prefix to check in the attribute name, use an empty string for no prefix
 * match: true if the prefix needs to be present, false if it should not be present
 * exclude: array of attribute names to exclude
 */
function getConfigFromAttributes(attributes,prefix,match,exclude) {
    var config = {};
	exclude = exclude || [];
    $tw.utils.each(attributes,function(attribute,name) {
	// node.classList[state ? "add" : "remove"](class_name);
    	if( ((match && name.startsWith(prefix)) || (!match && !name.startsWith(prefix))) && !exclude.includes(name) ) {
            //check if we have a boolean represented as a string
            var attr = (attribute === "true") ? true : ((attribute === "false") ? false : attribute);
            //check if we have a number represented as a string
            if(!isNaN(parseFloat(attribute))) {
                attr = parseFloat(attr);
            }
    		config[name] = attr;
    	}
    });
	return config;
}

var Widget = require("$:/core/modules/widgets/widget.js").widget;


var MacyWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
MacyWidget.prototype = new Widget();

/*
Render this widget into the DOM
*/
MacyWidget.prototype.render = function(parent,nextSibling) {
	var self = this;
	this.parentDomNode = parent;
	this.computeAttributes();
	this.execute();	
	this.domNode = this.document.createElement("div");
	this.domNode.className = "macy-container";
	this.domNode.style.position = "relative";
	parent.insertBefore(this.domNode,nextSibling);

/*
	$tw.sq.data = new Map();
	$tw.sq.data[this.domNode] = this;
	console.log($tw.sq.data[this.domNode]);
*/
	if(!$tw.sq.Macy) {
		$tw.sq.Macy = require("$:/plugins/sq/macy/macy.js");
	}
	this.macy = new $tw.sq.Macy($tw.utils.extend(this.macyConfig,{"container":this.domNode}));
	this.renderChildren(this.domNode,null);
	this.domNodes.push(this.domNode);
	// add event listener on root widget and re-use?
		// https://stackoverflow.com/questions/66109481/how-to-utilize-resizeobserver-for-multiple-behaviors
		// https://stackoverflow.com/questions/51528940/resizeobserver-one-vs-multiple-performance
	this.macy.on(this.macy.constants.EVENT_IMAGE_COMPLETE, function (ctx) {
		$tw.utils.addClass(self.domNode,"macy-ready");
		self.attachResizeObserver(self.domNode,100,true,true,function(){self.macy.recalculate(true,true);});
		var duration = $tw.utils.getAnimationDuration();
		self.win.setTimeout(function(){self.macy.recalculate(true,true)},duration);
	});
};

/*
 * node				HTML Element to observe
 * delay			timeout parameter
 * observeWidth		boolean to indicate whether a change in width should trigger the callback
 * observeHeight	boolean to indicate whether a change in height should trigger the callback
 * callback			function to call when size has changed
 */
MacyWidget.prototype.attachResizeObserver = function(node,delay,observeWidth,observeHeight,callback) {
	var self = this;
	if(!this.win) {
		this.win = self.document.parentWindow || self.document.defaultView;
	}
	if(!this.state) {
		this.state = Object.create(null);
	}
	this.state.resizeObserver = Object.create(null);
	self.resizeObserver = new self.win.ResizeObserver(entries => {
		for(let entry of entries) {
			// wrap in requestAnimationFrame to avoid observer loop limit error
			// https://stackoverflow.com/questions/49384120/resizeobserver-loop-limit-exceeded
			// https://blog.elantha.com/resizeobserver-loop-limit-exceeded/
			debounce(function() {
				if (!Array.isArray(entries) || !entries.length) {
					  return;
					}
				if((observeHeight && (parseInt(entry.contentBoxSize[0]["blockSize"]) !== self.state.resizeObserver.height)) || (observeWidth && (parseInt(entry.contentBoxSize[0]["inlineSize"]) !== self.state.resizeObserver.width))) {
					self.resizeObserver.unobserve(node);
					self.state.resizeObserver.height = entry.contentBoxSize[0]["blockSize"];
					self.state.resizeObserver.width = entry.contentBoxSize[0]["inlineSize"];

					self.win.clearTimeout(self.state.resizeObserver.resizeTimeoutId);
					self.state.resizeObserver.resizeTimeoutId = self.win.setTimeout(function(){
						//self.swiper.updateSize();
						callback.call();
						self.win.requestAnimationFrame(() => {
							self.resizeObserver.observe(node);
						})
					}, delay);
				}
			})();
		}		
	});
	self.resizeObserver.observe(node);
};

MacyWidget.prototype.execute = function() {
	var configText = this.wiki.getTiddlerText("$:/plugins/sq/macy/default_config.js","{}"),
		defaultConfig = $tw.utils.parseJSONSafe(this.wiki.getTiddlerText("$:/plugins/sq/macy/default_config.js","{}")),
		config = getConfigFromAttributes(this.attributes,"$",false,["breakAt"]),
		breakAtString = this.getAttribute("breakAt");
	
	if(breakAtString) {
		config.breakAt = Object.create(null);
		var breakPoints = breakAtString.trim().split(/\s+/);
		breakPoints.forEach((item) => {
			var params = item.split(":").map((item) => parseInt(item));
			if(params.length < 2) {
				return;
			}
			config.breakAt[params[0]] = {
				columns: params[1]
			};
			if(params[2] && params[3]) {
				config.breakAt[params[0]].margin = {
					x: params[2],
					y: params[3]
				}
			}
		})
	}
	this.macyConfig = $tw.utils.extend(defaultConfig,config);
	this.makeChildWidgets();
};

MacyWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	if($tw.utils.count(changedAttributes)>0) {
		this.macy.remove();
		this.refreshSelf();
		return true;
	} else {
		var retValue = this.refreshChildren(changedTiddlers);
		if(retValue) {
			this.macy.recalculate(true,true);
		} 
		return retValue;
	}
};

exports["macy"] = MacyWidget;

})();
