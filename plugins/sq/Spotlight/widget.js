/*\
title: $:/plugins/sq/spotlight/widget.js
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


var SpotlightWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
SpotlightWidget.prototype = new Widget();

/*
Render this widget into the DOM
*/
SpotlightWidget.prototype.render = function(parent,nextSibling) {
	this.parentDomNode = parent;
	this.computeAttributes();
	this.execute();
	this.renderChildren(parent,nextSibling);
};

SpotlightWidget.prototype.execute = function() {
	var images = $tw.utils.parseStringArray(this.getAttribute("$images","")),
		labels = $tw.utils.parseStringArray(this.getAttribute("$labels","")),
		galleryJSON = this.getAttribute("$gallery"),
		start = this.getAttribute("$start"),
		spotlightOptions = {fit: "contain"},
		index;
		
	if(!!galleryJSON) {
		this.gallery = $tw.utils.parseJSONSafe(galleryJSON,[]);
		//iterate over gallery and turn each src attribute into proper form for each item where media type is image or undefined
		this.gallery.map((item,pos,gallery) => {
			if(start && start === item.src) {
				index = pos;
			}
			if(!item.media || item.media === "image") {
				gallery[pos].src = this.getImageURI(item.src);
			}
		},this);
	} else {
		//iterate over images and labels, create gallery
		if(start) {
			index = images.indexOf(start);
		}
		this.gallery = images.map((image,index,images) => {
			return {src: this.getImageURI(image),title: labels[index] || ""};
		},this);
		if(index === -1) {
			this.gallery.every((el,i) => {
				if(el.src === start) {
					index = i;
					return false;
				}
				return true;
			});
		}
	}
	
	$tw.utils.each(this.attributes,function(attribute,name) {
		if(name.charAt(0) !== "$") {
			spotlightOptions[name] = attribute;
		}
	});
	spotlightOptions.index = !!start && index >=0 ? index + 1 : 1;
	this.spotlightOptions = spotlightOptions;
	/*
	this.spotlightOptions.onchange = function(index,options) {
		//get the document reference from the widget
		var pane = document.querySelectorAll(`#spotlight .spl-pane`);
		var img = pane[index-1].querySelector("img");
		img.addEventListener("load",function() {
			console.log(`Width: ${img.width}`);
		});
	};
	*/
};

SpotlightWidget.prototype.getImageURI = function(title) {
	var src = "",
		tiddler = this.wiki.getTiddler(title);
	if(!tiddler) {
		return title;
	} else {
		if(this.wiki.isImageTiddler(title)) {
			var type = tiddler.fields.type,
				text = tiddler.fields.text,
				_canonical_uri = tiddler.fields._canonical_uri;
			if(text) {
				switch(type) {
					case "image/svg+xml":
						src = "data:image/svg+xml," + encodeURIComponent(text);
						break;
					default:
						src = "data:" + type + ";base64," + text;
						break;
				}				
			} else if(_canonical_uri) {
				src = _canonical_uri;
			}
		}
		return src;
	}
};

SpotlightWidget.prototype.invokeAction = function(triggeringWidget, event) {
	var spotlight = require("$:/plugins/sq/spotlight/spotlight.js");
	spotlight.show(this.gallery,this.spotlightOptions);
	/*
	// exifreader needs to load the image itself, so CORS might be an issue for external images
	//	https://github.com/mattiasw/ExifReader/issues/186
	if(!$tw.sq.ExifReader) {
		$tw.sq.ExifReader = require("$:/plugins/sq/spotlight/exif-reader.js");
		console.log($tw.sq.ExifReader);		
	}
	*/

};

SpotlightWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	if($tw.utils.count(changedAttributes)>0) {
		this.refreshSelf();
		return true;
	} else {
		return this.refreshChildren(changedTiddlers);
	}
};

exports["action-spotlight"] = SpotlightWidget;

})();