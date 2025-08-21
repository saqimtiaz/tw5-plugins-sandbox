/*\
title: $:/plugins/sq/window-resize/startup/invoke-actions.js
type: application/javascript
module-type: startup

Invokes actionstrings tagged $:/tags/WindowResizeAction with window/screen dimensions.
\*/

exports.after = ["startup"];
exports.platforms = ["browser"];


function onResize(dims) {
	const vars = {
		"window-screen-width": String(window.screen.width),
		"window-screen-height": String(window.screen.height),
		"window-outer-width": String(dims.outerWidth),
		"window-outer-height": String(dims.outerHeight),
		"window-inner-width": String(dims.innerWidth),
		"window-inner-height": String(dims.innerHeight),
		"window-client-width": String(dims.clientWidth),
		"window-client-height": String(dims.clientHeight)
	};

	// Invoke all actionstrings tagged $:/tags/WindowResizeAction
	$tw.rootWidget.invokeActionsByTag("$:/tags/WindowResizeAction", $tw.rootWidget, null, vars);
}

exports.startup = function() {
	// Subscribe to the centralized window resize bus
	$tw.windowResizeBus.subscribe(onResize);
};
