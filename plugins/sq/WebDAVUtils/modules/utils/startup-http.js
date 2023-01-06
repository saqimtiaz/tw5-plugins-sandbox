/*\
title: $:/plugins/sq/webdav-utils/utils/startup-http.js
type: application/javascript
module-type: startup

Setup the root widget and the core root widget handlers

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

// Export name and synchronous status
exports.name = "rootwidget";
exports.platforms = ["browser"];
exports.after = ["startup"];
exports.before = ["story"];
exports.synchronous = true;

exports.startup = function() {
	// Install the HTTP client event handler
	$tw.httpClient = new $tw.utils._HttpClient();
	$tw.rootWidget.addEventListener("sqtm-http-request",function(event) {
		$tw.httpClient.handleHttpRequest(event);
	});
	
};

})();
