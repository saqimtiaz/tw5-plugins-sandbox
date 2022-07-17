/*\
title: $:/plugins/sq/window-resize/startup.js
type: application/javascript
module-type: startup

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";
exports.platforms = ["browser"];
exports.after = ["startup"];

/*
by rpemberton: https://gist.github.com/rpemberton/b15a206f453ff233830f3183e4ac371a
*/
function debounce(fn) {
	let raf;
	return (...args) => {
		if (raf) {
			return;
		}
		raf = window.requestAnimationFrame(() => {
			fn(...args); // run useful code
			raf = undefined;
		});
	};
}

let windowHeight,
	windowWidth;

function setInfoTiddlers(invokeActions) {
	var changed = false,
		newHeight = window.innerHeight,
		newWidth = window.innerWidth;
	if(windowHeight !== newHeight) {
		$tw.wiki.setText("$:/temp/info/browser/window/height","text",undefined,newHeight.toString());
		windowHeight = newHeight;
		changed = true;
	}
	if(windowWidth !== newWidth) {    
		$tw.wiki.setText("$:/temp/info/browser/window/width","text",undefined,newWidth.toString());
		windowWidth = newWidth;
		changed = true;
	}
	if(changed && invokeActions) {
		$tw.rootWidget.invokeActionsByTag("$:/tags/WindowResizeAction",$tw.rootWidget,null,{"sqtv-window-height": newHeight.toString(), "sqtv-window-width": newWidth.toString()})
	}
}

exports.startup = function() {
	setInfoTiddlers();
	window.onresize = function(){
		debounce(function(){setInfoTiddlers(true);})();
	};

};

})();